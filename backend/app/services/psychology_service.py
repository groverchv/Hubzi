import json
import logging
import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

try:
    from google import genai
    from google.genai import types as genai_types
    GENAI_AVAILABLE = True
except ImportError:
    genai = None
    genai_types = None
    GENAI_AVAILABLE = False

from app.core.config import settings

logger = logging.getLogger("hubzy.psychology_service")

# Modelos Gemini oficiales en orden de velocidad y cuota disponible
GEMINI_FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]


# =====================================================================
# ESQUEMAS PYDANTIC PARA PSICOLOGÍA Y SALUD EMOCIONAL
# =====================================================================

class PsychologyAnalysisResult(BaseModel):
    stress_level: float = Field(default=0.1, description="Nivel de estrés de 0.0 (total serenidad) a 1.0 (pánico/alta tensión)")
    stress_category: str = Field(default="calm", description="calm | mild_tension | moderate_anxiety | high_stress | crisis")
    emotion_detected: str = Field(default="calma", description="Emoción predominante identificada en el estudiante")
    cognitive_distortion: Optional[str] = Field(default=None, description="Distorsión cognitiva TCC (ej. Catastrofismo, Todo o Nada, Impostor)")
    needs_somatic_intervention: bool = Field(default=False, description="Verdadero si se recomienda activar respiración o grounding")
    recommended_intervention: str = Field(default="cognitive_reframe", description="breathing_478 | physiological_sigh | grounding_54321 | cognitive_reframe | micro_step")
    empathic_response: str = Field(default="Estoy aquí contigo. Respira con calma y avancemos paso a paso.", description="Mensaje cálido y terapéutico de Capi")
    clinical_rationale: str = Field(default="Regulación del tono vagal y desactivación simpática.", description="Fundamento neuropsicológico")
    is_crisis: bool = Field(default=False, description="Bandera roja de seguridad clínica (autolesión o crisis severa)")


# =====================================================================
# CATÁLOGO DE PROTOCOLOS CLÍNICOS BASADOS EN EVIDENCIA (TCC, ACT, VAGAL)
# =====================================================================

EVIDENCE_BASED_PROTOCOLS = {
    "breathing_478": {
        "name": "Respiración 4-7-8 (Dr. Andrew Weil)",
        "objective": "Desacelerar la frecuencia cardíaca mediante estimulación del nervio vago y activación parasimpática.",
        "steps": [
            "Inhala profundamente por la nariz durante 4 segundos.",
            "Retén el aire con calma en tus pulmones durante 7 segundos.",
            "Exhala lentamente por la boca en 8 segundos, vaciando toda la tensión."
        ],
        "duration_seconds": 38,
        "ideal_for": ["moderate_anxiety", "high_stress", "taquicardia", "bloqueo_mental"]
    },
    "physiological_sigh": {
        "name": "Suspiro Fisiológico (Neurobiología de Stanford)",
        "objective": "Reabrir los alvéolos pulmonares colapsados y reducir el CO2 en sangre en menos de 20 segundos.",
        "steps": [
            "Toma una inhalación profunda por la nariz.",
            "Inmediatamente, da una segunda micro-inhalación corta por la nariz para llenar al máximo.",
            "Suelta todo el aire por la boca en una exhalación larga, suave y completa."
        ],
        "duration_seconds": 15,
        "ideal_for": ["mild_tension", "impaciencia", "inicio_de_estres"]
    },
    "grounding_54321": {
        "name": "Técnica de Enraizamiento Sensorial 5-4-3-2-1",
        "objective": "Desactivar la hiperactivación de la amígdala cerebral trayendo la atención consciente a estímulos sensoriales tangibles del presente.",
        "steps": [
            "Nombra 5 cosas que puedas ver a tu alrededor.",
            "Toca 4 texturas u objetos cercanos.",
            "Escucha 3 sonidos sutiles de tu entorno.",
            "Identifica 2 aromas.",
            "Reconoce 1 sensación agradable en tu cuerpo o sabor."
        ],
        "duration_seconds": 45,
        "ideal_for": ["desconexión", "ataque_de_pánico", "rumiación_obsesiva"]
    },
    "cognitive_reframe": {
        "name": "Reestructuración Cognitiva TCC (Aaron Beck)",
        "objective": "Desmantelar pensamientos automáticos distorsionados de incompetencia o catastrofismo académico.",
        "steps": [
            "Identifica el pensamiento limitante (ej: 'no voy a poder').",
            "Examina la evidencia real: ¿un error en una carta significa que no sabes nada?",
            "Reformula en una afirmación compasiva y realista basada en el aprendizaje continuo."
        ],
        "duration_seconds": 30,
        "ideal_for": ["perfeccionismo", "miedo_a_fallar", "autocrítica"]
    },
    "micro_step": {
        "name": "Fraccionamiento de Carga Cognitiva",
        "objective": "Evitar la parálisis por análisis reduciendo el problema a una única acción inmediata de 10 segundos.",
        "steps": [
            "Olvida el resto del tablero.",
            "Lee únicamente una sola palabra del concepto más simple.",
            "Toma una sola carta sin preocuparte por el puntaje total."
        ],
        "duration_seconds": 20,
        "ideal_for": ["abrumamiento", "sobrecarga_de_información"]
    }
}


# =====================================================================
# MOTOR DETERMINISTA DE CLASIFICACIÓN AFECTIVA Y DISTORSIONES (HEURÍSTICA CLÍNICA)
# =====================================================================

STRESS_KEYWORDS_MAP = {
    # Nivel Alto / Pánico (0.8 - 1.0)
    "crisis": [
        "no puedo más", "me quiero morir", "odio mi vida", "me rindo", "me voy a matar",
        "desesperado", "ataque de pánico", "no respiro", "me ahogo", "colapso"
    ],
    "high_stress": [
        "estoy muy estresado", "demasiado estresada", "ansiedad", "muy nervioso", "muy nerviosa",
        "no sirvo para nada", "voy a reprobar", "no entiendo nada", "todo mal", "no doy más",
        "bloqueado", "bloqueada", "me tiemblan las manos", "llorar", "frustración total"
    ],
    # Nivel Moderado (0.5 - 0.79)
    "moderate_anxiety": [
        "estresado", "estresada", "difícil", "complicado", "tengo miedo", "no sé qué hacer",
        "me cuesta", "me equivoqué", "fallé", "qué rabia", "confuso", "no llego", "apuro",
        "presión", "angustia", "tensión", "preocupado", "preocupada"
    ],
    # Nivel Leve / Impaciencia (0.25 - 0.49)
    "mild_tension": [
        "uhm", "a ver", "no sé", "duda", "pista", "ayuda", "perdido", "perdida",
        "un poco difícil", "no me sale", "vamos a ver"
    ]
}

DISTORTIONS_PATTERNS = [
    (r"\b(nunca|jamás|todo|nada|siempre)\b", "Pensamiento Todo o Nada (Polarización)", "Pensamiento dicotómico que ignora los matices y el progreso parcial."),
    (r"\b(voy a reprobar|es el fin|es un desastre|todo saldrá mal|arruiné todo)\b", "Catastrofismo", "Anticipación del peor escenario posible sin evidencia proporcional."),
    (r"\b(no sirvo|soy tonto|soy inútil|todos son mejores|no soy capaz)\b", "Desvalorización / Síndrome del Impostor", "Atribución interna negativa que socava la autoeficacia académica."),
    (r"\b(debería saber|tengo que ser perfecto|no puedo fallar)\b", "Exigencias Rígidas ('Los Debería')", "Autoexigencia desadaptativa que detona cortisol y parálisis.")
]


# =====================================================================
# SYSTEM PROMPT DE PSICOLOGÍA CLÍNICA PARA GEMINI
# =====================================================================

PSYCHOLOGY_SYSTEM_PROMPT = """
Eres Capi, una neuropsicóloga clínica y tutora empática de élite en la plataforma EdTech Hubzy.
Tu misión es reducir el estrés agudo, la ansiedad ante exámenes y el bloqueo cognitivo en estudiantes universitarios,
utilizando principios rigurosos de Terapia Cognitivo-Conductual (TCC), Terapia de Aceptación y Compromiso (ACT) y Regulación Vagal.

CRITERIOS CLÍNICOS OBLIGATORIOS:
1. Evalúa el mensaje del usuario considerando su nivel de activación fisiológica, valencia emocional y distorsiones cognitivas.
2. Si detectas catastrofismo, autocrítica o pánico, NO des una respuesta fría ni técnica.
3. Brinda una validación emocional incondicional y un reencuadre cognitivo suave (máximo 25-35 palabras para voz).
4. Si el nivel de estrés es moderado o alto (>= 0.5), recomienda explícitamente una pausa de respiración consciente (ej. 'breathing_478' o 'physiological_sigh').
5. Si detectas ideación autolítica o crisis grave, activa 'is_crisis: true' y proporciona contención protectora inmediata.

FORMATO DE RESPUESTA OBLIGATORIO:
Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura:
{
  "stress_level": 0.65,
  "stress_category": "moderate_anxiety",
  "emotion_detected": "frustración académica",
  "cognitive_distortion": "Catastrofismo",
  "needs_somatic_intervention": true,
  "recommended_intervention": "breathing_478",
  "empathic_response": "Tranquilo mi amiguito. Respirar hondo un momento calmará tu mente. Recuerda que equivocarse en una carta es parte natural del aprendizaje. ¡Hagamos una respiración juntos!",
  "clinical_rationale": "Desactivación del sistema simpático y reducción de rumiación mediante reestructuración y respiración 4-7-8.",
  "is_crisis": false
}
"""


class PsychologyNLPService:
    def __init__(self):
        self.client = None
        if GENAI_AVAILABLE and settings.GEMINI_API_KEY:
            try:
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
                logger.info("Psychology NLP Service conectado a Gemini con SDK google-genai.")
            except Exception as e:
                logger.warning(f"No se pudo inicializar Gemini para PsychologyService: {e}")

    def analyze_emotional_state(self, text: str, context: Optional[Dict[str, Any]] = None) -> PsychologyAnalysisResult:
        """
        Analiza el estado psicológico y nivel de estrés del usuario a partir de texto o transcripción de voz.
        Combina un analizador heurístico neuropsicológico determinista ultrarrápido con Gemini Multimodal.
        """
        if not text or not text.strip():
            return PsychologyAnalysisResult(
                stress_level=0.1,
                stress_category="calm",
                emotion_detected="serenidad",
                needs_somatic_intervention=False,
                recommended_intervention="micro_step",
                empathic_response="Estoy aquí para acompañarte en tu estudio. ¿En qué concepto te gustaría enfocarte?"
            )

        clean_text = text.lower().strip()

        # 1. VERIFICACIÓN DE SEGURIDAD CLÍNICA / BANDERA ROJA (CRISIS)
        for crisis_word in STRESS_KEYWORDS_MAP["crisis"]:
            if crisis_word in clean_text:
                logger.warning(f"🚨 ALERTA DE SEGURIDAD PSICOLÓGICA DETECTADA: '{crisis_word}' en texto.")
                return PsychologyAnalysisResult(
                    stress_level=1.0,
                    stress_category="crisis",
                    emotion_detected="desesperanza aguda",
                    cognitive_distortion="Catastrofismo / Crisis",
                    needs_somatic_intervention=True,
                    recommended_intervention="grounding_54321",
                    empathic_response="Tu vida y tu bienestar son lo más valioso. Por favor detén la pantalla, respira conmigo y recuerda que no estás solo. Puedes llamar a las líneas de ayuda gratuita en salud mental.",
                    clinical_rationale="Protocolo ético de protección y contención inmediata en crisis.",
                    is_crisis=True
                )

        # 2. EVALUACIÓN HEURÍSTICA BASE
        base_result = self._heuristic_analysis(clean_text)

        # 3. SI GEMINI ESTÁ DISPONIBLE, PROFUNDIZAR CON NLP CLÍNICO AVANZADO
        if self.client:
            try:
                ai_result = self._gemini_clinical_evaluation(text, context)
                if ai_result:
                    return ai_result
            except Exception as e:
                logger.warning(f"Error en evaluación clínica Gemini, usando análisis heurístico: {e}")

        return base_result

    def _heuristic_analysis(self, clean_text: str) -> PsychologyAnalysisResult:
        """
        Motor de clasificación neuropsicológica determinista de baja latencia (<1ms).
        Evalúa densidad de términos estresores, distorsiones cognitivas y signos de activación.
        """
        stress_score = 0.1
        category = "calm"
        detected_emotion = "curiosidad"
        distortion = None
        needs_breathing = False
        intervention = "micro_step"
        empathic_text = "¡Vas por buen camino! Tómate tu tiempo para analizar cada concepto."

        # Detectar distorsiones cognitivas
        for pattern, dist_name, _ in DISTORTIONS_PATTERNS:
            if re.search(pattern, clean_text):
                distortion = dist_name
                stress_score += 0.25
                break

        # Evaluar palabras clave de estrés
        if any(w in clean_text for w in STRESS_KEYWORDS_MAP["high_stress"]):
            stress_score = max(stress_score, 0.78)
            category = "high_stress"
            detected_emotion = "ansiedad académica / frustración intensa"
            needs_breathing = True
            intervention = "breathing_478"
            empathic_text = "Siento que hay mucha tensión ahora mismo amiguito. Detengámonos 30 segundos a respirar. Tu cerebro necesita oxígeno para brillar."
        elif any(w in clean_text for w in STRESS_KEYWORDS_MAP["moderate_anxiety"]):
            stress_score = max(stress_score, 0.55)
            category = "moderate_anxiety"
            detected_emotion = "tensión / inseguridad"
            needs_breathing = True
            intervention = "physiological_sigh"
            empathic_text = "No te preocupes por equivocarte. Cada intento entrena tus neuronas. Respira suave y elige la opción que más te resuene."
        elif any(w in clean_text for w in STRESS_KEYWORDS_MAP["mild_tension"]):
            stress_score = max(stress_score, 0.35)
            category = "mild_tension"
            detected_emotion = "duda cognitiva"
            needs_breathing = False
            intervention = "cognitive_reframe"
            empathic_text = "Es normal tener dudas con temas complejos. Miremos las palabras clave de la pregunta juntos."

        # Signos de exclamación o longitud de queja
        if clean_text.count("!") >= 2 or clean_text.count("?") >= 3:
            stress_score = min(1.0, stress_score + 0.15)

        return PsychologyAnalysisResult(
            stress_level=min(1.0, round(stress_score, 2)),
            stress_category=category,
            emotion_detected=detected_emotion,
            cognitive_distortion=distortion,
            needs_somatic_intervention=needs_breathing,
            recommended_intervention=intervention,
            empathic_response=empathic_text,
            clinical_rationale=f"Evaluación de carga alostática: {category} con distorsión '{distortion or 'Ninguna'}'."
        )

    def _gemini_clinical_evaluation(self, text: str, context: Optional[Dict[str, Any]] = None) -> Optional[PsychologyAnalysisResult]:
        """
        Ejecuta el pipeline de NLP psicológico con Gemini para captar sutilezas emocionales,
        ironía, fatiga o sobrecarga mental.
        """
        context_str = ""
        if context:
            context_str = f"\nContexto del estudiante: {json.dumps(context, ensure_ascii=False)}"

        user_content = f"Mensaje del estudiante (voz/texto):\n\"{text}\"{context_str}"

        for model_name in GEMINI_FALLBACK_MODELS:
            try:
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=user_content,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=PSYCHOLOGY_SYSTEM_PROMPT,
                        temperature=0.3,
                        response_mime_type="application/json",
                        max_output_tokens=350
                    )
                )

                if response and response.text:
                    data = json.loads(response.text.strip())
                    return PsychologyAnalysisResult(
                        stress_level=float(data.get("stress_level", 0.2)),
                        stress_category=str(data.get("stress_category", "calm")),
                        emotion_detected=str(data.get("emotion_detected", "calma")),
                        cognitive_distortion=data.get("cognitive_distortion"),
                        needs_somatic_intervention=bool(data.get("needs_somatic_intervention", False)),
                        recommended_intervention=str(data.get("recommended_intervention", "cognitive_reframe")),
                        empathic_response=str(data.get("empathic_response", "Estoy contigo para ayudarte a aprender con serenidad.")),
                        clinical_rationale=str(data.get("clinical_rationale", "Intervención de psicología positiva y TCC.")),
                        is_crisis=bool(data.get("is_crisis", False))
                    )
            except Exception as e:
                logger.debug(f"Intento de análisis con {model_name} no disponible: {e}")
                continue

        return None

    def reframe_negative_thought(self, anxious_thought: str) -> Dict[str, str]:
        """
        Reestructura un pensamiento automático negativo o catastrófico del estudiante
        en una perspectiva equilibrada, realista y compasiva según la TCC.
        """
        if not self.client:
            return {
                "original_thought": anxious_thought,
                "reframe": "Este pensamiento es solo una reacción temporal al esfuerzo. Un error no define tu capacidad de aprender.",
                "technique": "Descentramiento cognitivo TCC"
            }

        reframe_prompt = (
            "Eres un terapeuta cognitivo-conductual experto en psicología educativa. "
            "Toma el siguiente pensamiento ansioso de un estudiante universitario "
            "y transfórmalo en una reformulación realista, profundamente compasiva y constructiva en máximo 1-2 oraciones.\n"
            f"Pensamiento ansioso: '{anxious_thought}'"
        )
        try:
            res = self.client.models.generate_content(
                model=GEMINI_FALLBACK_MODELS[0],
                contents=reframe_prompt
            )
            if res and res.text:
                return {
                    "original_thought": anxious_thought,
                    "reframe": res.text.strip().replace('"', ''),
                    "technique": "Reestructuración Cognitiva TCC"
                }
        except Exception as e:
            logger.warning(f"Error en reframe con Gemini: {e}")

        return {
            "original_thought": anxious_thought,
            "reframe": "Equivocarse en un ejercicio es la forma más rápida y efectiva en que tu cerebro consolida nuevos conocimientos.",
            "technique": "Normalización del error y crecimiento neuronal"
        }

    def get_protocols(self) -> Dict[str, Any]:
        """Devuelve los protocolos clínicos indexados para reducción de estrés."""
        return EVIDENCE_BASED_PROTOCOLS


# Instancia singleton del servicio
psychology_service = PsychologyNLPService()

