import json
import logging
from typing import Dict, Any, Optional, List

try:
    from google import genai
    from google.genai import types as genai_types
    GENAI_AVAILABLE = True
except ImportError:
    genai = None
    genai_types = None
    GENAI_AVAILABLE = False

from app.core.config import settings

logger = logging.getLogger("hubzy.ai_service")

# Directivas pedagógicas por nivel de juego
LEVEL_DESCRIPTIONS = {
    1: {
        "name": "Fácil",
        "questions": 3,
        "difficulty": "facil",
        "guideline": (
            "NIVEL 1 - FÁCIL: Las preguntas deben ser MUY FÁCILES DE PREDECIR, directas, evidentes y "
            "centradas en las definiciones más obvias, literales y fundamentales que aparecen al inicio o de forma destacada en el texto."
        )
    },
    2: {
        "name": "Semi-normal",
        "questions": 5,
        "difficulty": "seminormal",
        "guideline": (
            "NIVEL 2 - SEMI-NORMAL: Preguntas de comprensión básica y operativa, términos clave claros y bien "
            "diferenciados, accesibles pero requiriendo lectura atenta del documento."
        )
    },
    3: {
        "name": "Normal",
        "questions": 8,
        "difficulty": "normal",
        "guideline": (
            "NIVEL 3 - NORMAL: Preguntas estándar con aplicación conceptual, distinción de características y "
            "relaciones entre conceptos planteados en el documento."
        )
    },
    4: {
        "name": "Semi-difícil",
        "questions": 15,
        "difficulty": "semidificil",
        "guideline": (
            "NIVEL 4 - SEMI-DIFÍCIL: Preguntas con análisis crítico, inferencias pedagógicas, relaciones más sutiles y "
            "terminología técnica especializada extraída a lo largo de todo el documento."
        )
    },
    5: {
        "name": "Difícil",
        "questions": 20,
        "difficulty": "dificil",
        "guideline": (
            "NIVEL 5 - DIFÍCIL: Preguntas de máxima exigencia analítica, casos de estudio integrados, "
            "discriminación conceptual de alta precisión y cobertura exhaustiva de detalles minuciosos del texto."
        )
    }
}

def build_system_instruction(question_count: int = 5, difficulty: str = "normal", level: int = 1) -> str:
    """Construye las instrucciones dinámicas de Gemini calibradas por cantidad y nivel de dificultad."""
    distractor_count = max(1, round(question_count * 0.30))
    lvl_info = LEVEL_DESCRIPTIONS.get(level, LEVEL_DESCRIPTIONS[1])
    guideline = lvl_info["guideline"]

    return f"""
Eres un evaluador académico universitario experto y diseñador de simulacros de examen en la plataforma Hubzy.

⚠️ REGLA ABSOLUTA — SIN EXCEPCIONES:
- ÚNICAMENTE debes analizar y formular preguntas a partir del texto que se te proporciona en este mensaje.
- ESTÁ TERMINANTEMENTE PROHIBIDO usar conocimiento propio, enciclopédico, de internet, de otros documentos o de entrenamiento previo.
- Si el texto no contiene información suficiente sobre un concepto, NO lo incluyas. Trabaja SOLO con lo que está escrito.
- Las preguntas deben provenir de párrafos, definiciones, fórmulas, procedimientos o casos concretos extraídos del texto suministrado.

CALIBRACIÓN DE DIFICULTAD Y PEDAGOGÍA:
- {guideline}
- Dificultad solicitada: {difficulty.upper()} (Nivel {level}/5).

CRITERIOS PEDAGÓGICOS OBLIGATORIOS:
1. Extrae EXACTAMENTE {question_count} conceptos, principios, fórmulas, procedimientos o tesis presentes EXPLÍCITAMENTE en el texto.
2. Para cada concepto genera:
   - "concept_name": El término técnico exacto tal como aparece en el documento (la carta respuesta del alumno).
   - "content": Síntesis de 1-2 líneas que explica POR QUÉ es la respuesta correcta, usando el lenguaje del propio documento.
   - "points_multiplier": "1x" (básico), "2x" (intermedio), "3x" (avanzado).
   - "node_question": REACTIVO DE EXAMEN REAL basado en el texto y calibrado a la dificultad indicada.
   - "node_hint": Pista nemotécnica que oriente al alumno hacia la respuesta SIN decir el nombre de la carta.
3. CARTAS CON FALSAS RESPUESTAS / DISTRACTORES (EXACTAMENTE EL 30% = {distractor_count} DISTRACTORES):
   - Genera exactamente {distractor_count} términos técnicos o conceptos verosímiles pero INCORRECTOS para estas preguntas.
   - Para cada distractor incluye "concept_name" y "content" explicando brevemente por qué es falso o no aplica.
4. El "title" debe reflejar el tema central que REALMENTE aparece en el texto.
5. RESPONDE ÚNICAMENTE con un objeto JSON válido, sin formato markdown extra.

Estructura JSON requerida:
{{
  "title": "Simulacro de Examen: [Tema Real del Texto]",
  "level": {level},
  "difficulty": "{difficulty}",
  "concepts": [
    {{
      "concept_name": "Término Técnico 1",
      "content": "Fundamentación extraída del texto...",
      "points_multiplier": "1x",
      "node_question": "¿Según el documento, qué establece...?",
      "node_hint": "Revisa la sección donde se explica..."
    }}
  ],
  "distractors": [
    {{
      "concept_name": "Distractor Verosímil 1",
      "content": "Concepto no aplicable a estos reactivos.",
      "points_multiplier": "1x"
    }}
  ]
}}
"""

SYSTEM_INSTRUCTION = build_system_instruction(question_count=5, difficulty="normal", level=2)


# Modelos en orden de preferencia y cuota disponible. Si uno falla con 429 (cuota agotada) o 503, se usa el siguiente automáticamente.
# Modelos oficiales de Google Gemini en orden de velocidad y cuota disponible.
GEMINI_FALLBACK_MODELS = [
    "gemini-flash-latest",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
]

class AIService:
    def __init__(self):
        self.client = None
        if GENAI_AVAILABLE and settings.GEMINI_API_KEY:
            try:
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
                logger.info("Google GenAI client inicializado correctamente (SDK google-genai).")
            except Exception as e:
                self.client = None
                logger.warning(f"No se pudo inicializar google-genai Client: {e}")
        else:
            if not GENAI_AVAILABLE:
                logger.warning("google-genai no está instalado. Instala con: pip install google-genai")
            else:
                logger.warning("GEMINI_API_KEY no configurada en el entorno.")

    def extract_concepts_from_text(
        self, 
        study_text: str, 
        variation_seed: int = 0,
        question_count: int = 3,
        difficulty: str = "facil",
        level: int = 1
    ) -> Dict[str, Any]:
        """
        Envía el texto REAL del documento a Gemini con prompt estructurado
        y parsea el JSON resultante para generar preguntas dinámicas de examen
        calibradas exactamente al nivel (1 a 5), dificultad y número de preguntas.
        """
        if not self.client:
            raise RuntimeError(
                "GEMINI_API_KEY no está configurada en el servidor. "
                "Agrega la clave en el archivo .env para procesar el material dinámicamente con IA."
            )

        # Analizar el documento COMPLETO sin truncar arbitrariamente (hasta 500k caracteres)
        full_text = study_text[:500000] if len(study_text) > 500000 else study_text

        dynamic_sys_instruction = build_system_instruction(
            question_count=question_count,
            difficulty=difficulty,
            level=level
        )

        variation_directive = ""
        if variation_seed > 0:
            variation_directive = (
                f"\n\n🚨 INSTRUCCIÓN DE REINICIO DE PARTIDA (RONDA #{variation_seed}):\n"
                f"- El usuario ha reiniciado la partida. ESTÁ TERMINANTEMENTE PROHIBIDO repetir preguntas anteriores.\n"
                f"- Formula exactamente {question_count} preguntas y conceptos clave COMPLETAMENTE DIFERENTES basados en otras secciones, definiciones o fórmulas del texto.\n"
                f"- Respeta con exactitud la dificultad '{difficulty}' (Nivel {level}/5)."
            )

        prompt = (
            f"Analiza exhaustivamente el siguiente documento académico completo para el NIVEL {level} ({difficulty.upper()} con {question_count} preguntas):{variation_directive}\n\n"
            f"Texto del documento:\n{full_text}"
        )

        last_error = None
        for model_name in GEMINI_FALLBACK_MODELS:
            try:
                logger.info(f"Invocando Gemini con modelo '{model_name}' (nivel: {level}, {question_count} preguntas, seed: {variation_seed})...")
                config_kwargs = {
                    "system_instruction": dynamic_sys_instruction,
                    "temperature": 0.85 if variation_seed > 0 else 0.4,
                    "response_mime_type": "application/json",
                }
                if hasattr(genai_types, 'ThinkingConfig'):
                    try:
                        config_kwargs["thinking_config"] = genai_types.ThinkingConfig(thinking_budget=0)
                    except Exception:
                        pass

                try:
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=genai_types.GenerateContentConfig(**config_kwargs)
                    )
                except Exception as call_err:
                    logger.warning(f"Error inicial con {model_name}: {call_err}. Reintentando sin thinking_config...")
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=genai_types.GenerateContentConfig(
                            system_instruction=dynamic_sys_instruction,
                            temperature=0.85 if variation_seed > 0 else 0.4,
                            response_mime_type="application/json",
                        )
                    )

                raw_text = (response.text or "").strip()

                # Limpieza defensiva en caso de que venga envuelto en markdown
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.startswith("```"):
                    raw_text = raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                raw_text = raw_text.strip()

                parsed_json = json.loads(raw_text)
                logger.info(f"Reactivos generados exitosamente con modelo '{model_name}'.")
                return parsed_json

            except json.JSONDecodeError as jde:
                logger.error(f"Error parseando JSON de Gemini ({model_name}): {jde} | Contenido: {raw_text[:500]}")
                last_error = ValueError(f"La IA ({model_name}) no devolvió un formato JSON válido: {str(jde)}")
                # Si falló el parseo de este modelo, intentamos el siguiente
                continue
            except Exception as e:
                err_str = str(e)
                logger.warning(f"Modelo '{model_name}' falló ({err_str[:200]}). Probando siguiente modelo de respaldo...")
                last_error = e
                continue

        logger.error(f"Todos los modelos de Gemini fallaron: {last_error}")
        raise RuntimeError(f"Error de comunicación con el motor de IA (todos los modelos agotados): {str(last_error)}")

    def extract_text_multimodal_ocr(self, file_bytes: bytes, mime_type: str) -> str:
        """
        Motor OCR Multimodal con Gemini:
        Transcribe fielmente documentos escaneados, imágenes de apuntes manuscritos,
        pizarras, diapositivas o PDFs que son únicamente imágenes.
        Con fallback automático entre modelos para máxima disponibilidad.
        """
        if not self.client:
            raise RuntimeError(
                "GEMINI_API_KEY no configurada. Necesaria para ejecutar el motor OCR con IA."
            )

        prompt = (
            "Eres un motor de OCR y transcripción académica de ultra-alta fidelidad para Hubzy. "
            "Tu objetivo es transcribir fielmente TODO el contenido legible de este documento o imagen:\n"
            "- Transcribe títulos, subtítulos, párrafos, listas, definiciones y teoremas.\n"
            "- Si hay fórmulas matemáticas, transcríbelas en notación clara o LaTeX.\n"
            "- Si hay tablas o diagramas conceptuales, transcribe sus datos estructurados.\n"
            "- Conserva el orden lógico del documento.\n"
            "⚠️ REGLA: Devuelve ÚNICAMENTE el texto extraído. No añadas saludos, intros, explicaciones ni comentarios tuyos."
        )

        part = genai_types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
        last_error = None

        for model_name in GEMINI_FALLBACK_MODELS:
            try:
                logger.info(f"Ejecutando OCR Multimodal ultra-rápido con modelo '{model_name}'...")
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=[part, prompt],
                    config=genai_types.GenerateContentConfig(
                        temperature=0.2,
                        thinking_config=genai_types.ThinkingConfig(thinking_budget=0) if hasattr(genai_types, 'ThinkingConfig') else None,
                    )
                )
                extracted = (response.text or "").strip()
                logger.info(f"OCR completado exitosamente con '{model_name}': {len(extracted)} caracteres extraídos.")
                return extracted
            except Exception as e:
                logger.warning(f"OCR con '{model_name}' falló ({str(e)[:200]}). Intentando siguiente modelo...")
                last_error = e
                continue

        logger.error(f"Error en OCR multimodal en todos los modelos: {last_error}")
        raise RuntimeError(f"Error procesando OCR del archivo: {str(last_error)}")

    def extract_document_text(self, file_bytes: bytes, filename: str) -> str:
        """
        Pipeline Híbrido Inteligente de Extracción de Texto:
        1. PDFs:
           - Paso 1: Intenta pypdf (ultrarrápido, ~50-200ms para PDFs digitales nativos completos).
           - Analiza TODAS las páginas del documento sin límites arbitrarios.
           - Paso 2: Si el texto extraído es insuficiente (< 50 caracteres), activa Gemini OCR multimodal.
        2. Imágenes (.png, .jpg, .jpeg, .webp):
           - Activa Gemini OCR multimodal directamente.
        3. Texto plano (.txt, .md, .csv):
           - Decodifica en UTF-8 o latin-1.
        """
        lower_name = (filename or "").lower()

        # 1. ARCHIVOS PDF
        if lower_name.endswith(".pdf"):
            pdf_text = ""
            try:
                import io
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(file_bytes))
                pages = []
                # Analizar TODAS las páginas del documento completo
                for p in reader.pages:
                    t = p.extract_text()
                    if t:
                        pages.append(t)
                pdf_text = "\n\n".join(pages).strip()
            except Exception as pe:
                logger.warning(f"Extracción directa pypdf falló para '{filename}': {pe}")

            # Si se obtuvo texto nativo suficiente, retornarlo de inmediato (0 costo y milisegundos)
            if len(pdf_text) >= 50:
                logger.info(f"Extracción nativa pypdf exitosa para '{filename}' ({len(reader.pages)} páginas): {len(pdf_text)} caracteres")
                return pdf_text


            # Si el PDF es escaneado (sin capa de texto), activar OCR Multimodal con Gemini
            logger.info(f"PDF '{filename}' parece ser escaneado o imagen (longitud {len(pdf_text)}). Activando OCR Multimodal Gemini...")
            return self.extract_text_multimodal_ocr(file_bytes, "application/pdf")

        # 2. IMÁGENES
        image_mimes = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
            ".bmp": "image/bmp",
        }
        for ext, mime in image_mimes.items():
            if lower_name.endswith(ext):
                logger.info(f"Procesando imagen '{filename}' con OCR Multimodal ({mime})...")
                return self.extract_text_multimodal_ocr(file_bytes, mime)

        # 3. TEXTO PLANO
        try:
            return file_bytes.decode("utf-8").strip()
        except UnicodeDecodeError:
            try:
                return file_bytes.decode("latin-1").strip()
            except Exception as de:
                return ""

    def generate_capy_response_with_psychology(
        self, 
        user_message: str, 
        nodes_context: list, 
        hand_context: list, 
        theme: str = "",
        user_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analiza el estado psicológico y emocional del estudiante usando NLP
        y formula una respuesta empática, tierna y personalizada según el nombre,
        género y edad del estudiante.
        """
        from app.services.psychology_service import psychology_service

        user_info = user_profile or {}
        student_name = user_info.get("username", "amiguito")
        gender = (user_info.get("gender") or "otro").strip().lower()
        age = user_info.get("age", 20)

        # Configuración de rol según la regla de género:
        # Estudiante Hombre -> Capi como figura protectora y maternal femenina
        # Estudiante Mujer -> Capi como figura sabia y serena masculina
        if gender in ("masculino", "hombre", "varon"):
            persona_role = "Hablas como una capibara consejera femenina, infinitamente dulce, tierna y maternal."
            vocative = "mi campeón lindo, mi cielo, mi rey inteligente"
        elif gender in ("femenino", "mujer", "dama"):
            persona_role = "Hablas como un capibara consejero masculino, sabio, sereno, protector y profundamente comprensivo."
            vocative = "mi campeona hermosa, mi niña linda, mi estrella brillante"
        else:
            persona_role = "Hablas como una capibara sabia y amorosa, refugio incondicional de paz."
            vocative = "mi corazón, mi sol, mi gran pensador"

        # Modulación según grupo etario
        if age < 18:
            age_tone = f"El estudiante {student_name} tiene {age} años. Tu tono debe ser lúdico, dinámico, entusiasta y muy cercano, sin formalismos rígidos."
        elif age <= 25:
            age_tone = f"El estudiante {student_name} tiene {age} años (etapa universitaria/académica). Comprende la ansiedad de exámenes, entregas y desvelos; sé su bálsamo anti-estrés."
        else:
            age_tone = f"El estudiante {student_name} tiene {age} años (adulto/profesional). Sé respetuoso, maduro, empático y centrado en la serenidad mental y claridad cognitiva."

        # 1. Evaluación clínica del estado emocional y nivel de estrés
        context_data = {
            "unsolved_nodes": len([n for n in nodes_context if not n.get("isSolved")]),
            "theme": theme,
            "student_name": student_name,
            "age": age,
            "gender": gender
        }
        psych_analysis = psychology_service.analyze_emotional_state(user_message, context=context_data)

        # Si el cliente no está inicializado, devolver respuesta heurística
        if not self.client:
            return {
                "reply": psych_analysis.empathic_response,
                "psychology": psych_analysis.model_dump()
            }

        # 2. Si detecta crisis o estrés muy agudo, priorizar contención afectiva inmediata
        if psych_analysis.is_crisis or psych_analysis.stress_level >= 0.85:
            return {
                "reply": psych_analysis.empathic_response,
                "psychology": psych_analysis.model_dump()
            }

        # 3. Construir contexto del tablero pedagógico
        nodes_summary = "\n".join([
            f"- Nodo: {n.get('label', '')} | Pregunta: {n.get('question', '')} | Pista clave: {n.get('hint', '')} | Estado: {'Resuelto' if n.get('isSolved') else 'Pendiente'}"
            for n in nodes_context
        ]) or "Nodos del circuito pendientes."

        hand_summary = ", ".join([
            f"{c.get('name', '')}{' (distractor)' if c.get('isDistractor') else ''}"
            for c in hand_context
        ]) or "Cartas en mano del usuario."

        # Adaptación del tono según el nivel de estrés
        tone_instruction = ""
        if psych_analysis.stress_level >= 0.5:
            tone_instruction = (
                f"\n🚨 ATENCIÓN CLÍNICA: El estudiante muestra {psych_analysis.stress_category} "
                f"(nivel {psych_analysis.stress_level}) con emoción '{psych_analysis.emotion_detected}'. "
                f"Distorsión detectada: '{psych_analysis.cognitive_distortion or 'tensión general'}'. "
                "Tu máxima prioridad es calmarlo con enorme calidez, validar su esfuerzo "
                "y recordarle que errar es parte del juego. Sugiere hacer una pausa o respirar juntos si lo necesita."
            )

        sys_prompt = (
            f"Eres Capi: una capibara terapeuta gamer de Hubzy. {persona_role}\n"
            f"Te diriges a tu estudiante {student_name}.\n"
            f"{age_tone}\n"
            f"El tema de la sesión es: '{theme}'.\n"
            f"{tone_instruction}\n"
            "INFORMACIÓN DEL TABLERO:\n"
            f"{nodes_summary}\n\n"
            "CARTAS DISPONIBLES:\n"
            f"{hand_summary}\n\n"
            "REGLAS OBLIGATORIAS DE TU VOZ Y PERSONALIDAD:\n"
            f"1. Llena al estudiante de afecto sincero y llámalo a veces por su nombre ({student_name}) o con expresiones como ({vocative}).\n"
            "2. Sé sintético: máximo 2 oraciones breves (entre 18 y 30 palabras) diseñadas para sonar como un abrazo al corazón.\n"
            "3. Si el usuario tiene miedo o frustración, valida su emoción y hazle sentir que no está solo y que un error no cambia lo valioso e inteligente que es.\n"
            "4. Si pide una pista, dale la luz pedagógica con mucho cariño y suavidad.\n"
            "5. Devuelve ÚNICAMENTE el texto limpio para ser pronunciado por voz (sin asteriscos, sin comillas)."
        )

        user_prompt = f"El usuario {student_name} te dice por micrófono: \"{user_message}\""


        for model_name in GEMINI_FALLBACK_MODELS:
            try:
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=user_prompt,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=sys_prompt,
                        temperature=0.6,
                        max_output_tokens=120
                    )
                )
                if response and response.text:
                    cleaned = response.text.strip().replace('"', '').replace('*', '')
                    if cleaned:
                        return {
                            "reply": cleaned,
                            "psychology": psych_analysis.model_dump()
                        }
            except Exception as e:
                logger.warning(f"Error generando pista con {model_name}: {e}")
                continue

        return {
            "reply": psych_analysis.empathic_response or "¡Confía en tu respiración y en tu mente! Todo saldrá bien.",
            "psychology": psych_analysis.model_dump()
        }

    def generate_capy_hint(self, user_message: str, nodes_context: list, hand_context: list, theme: str = "") -> str:
        """Compatibilidad regresiva: devuelve únicamente la locución textual."""
        result = self.generate_capy_response_with_psychology(user_message, nodes_context, hand_context, theme)
        return result.get("reply", "¡Confía en ti! Vamos paso a paso.")

    def generate_capy_speech(
        self,
        situation: str,
        level: int = 1,
        theme: str = "",
        user_profile: dict = None,
        history: list = None,
        context_data: dict = None
    ) -> str:
        """
        Genera alocuciones 100% dinámicas y no repetidas enfocadas en psicología positiva,
        reducción de ansiedad cognitiva y soporte emocional sereno y profesional.
        Sin piropos ni cursilerías exageradas.
        """
        history = history or []
        avoid_clause = ""
        if history:
            recent_avoid = "; ".join([f'"{h}"' for h in history[-8:]])
            avoid_clause = f"\n⚠️ REGLA ESTRICTA DE NO REPETICIÓN: NO repitas ninguna de estas frases previas ni uses sus mismas palabras iniciales: {recent_avoid}."

        level_psychology_descriptors = {
            1: "Calmado, claro y acogedor. Valida el inicio del proceso y promueve una respiración tranquila.",
            2: "Enfoque en autoeficacia. Destaca la atención sostenida, el análisis reflexivo y el progreso mental paso a paso.",
            3: "Refuerzo cognitivo. Valida el razonamiento lógico, ayuda a gestionar la frustración y normaliza el esfuerzo mental.",
            4: "Estrategias de regulación emocional ante la complejidad. Refuerza la serenidad, la paciencia y la confianza fundada en datos.",
            5: "Consolidación de maestría cognitiva. Celebra la resiliencia, la agudeza analítica y la madurez para resolver problemas difíciles con mente despejada."
        }
        psy_desc = level_psychology_descriptors.get(level, level_psychology_descriptors[1])

        situation_prompts = {
            "correct": "El estudiante acaba de conectar una carta correcta. Refuerza su capacidad de deducción lógica y concentración.",
            "wrong": "El estudiante colocó una carta errónea. Desdramatiza el error desde la Terapia Cognitivo-Conductual (el error es solo retroalimentación informativa). Invítalo a respirar y replantear.",
            "level_up": f"El estudiante avanza al Nivel {level}. Reconoce su resiliencia cognitiva y su capacidad de adaptación.",
            "hint": "El estudiante solicita una pista. Brinda orientación reflexiva estructurada para estimular su propio criterio.",
            "welcome": f"Inicio del Nivel {level}. Transmite calma mental, claridad de objetivos y contención.",
            "victory": "¡El estudiante ha completado con éxito todo el circuito! Valida su perseverancia y fortaleza mental."
        }
        sit_desc = situation_prompts.get(situation, "Intervención psicológica de apoyo en el estudio.")

        if self.client:
            sys_instruction = (
                "Eres Capi: un psicólogo cognitivo sereno, empático, profesional y reconfortante. "
                "Tu objetivo es reducir la ansiedad ante exámenes y optimizar el rendimiento del estudiante.\n"
                f"NIVEL COGNITIVO: Nivel {level}/5. Enfoque: {psy_desc}\n"
                f"SITUACIÓN: {sit_desc}\n"
                f"TEMA DE ESTUDIO: '{theme or 'Materia'}'\n"
                f"{avoid_clause}\n"
                "REGLAS OBLIGATORIAS:\n"
                "1. NO uses piropos, NO uses cursilerías ni apelativos empalagosos ('mi amor', 'mi rey', 'mi cielo', 'me derrito', etc.).\n"
                "2. Mantén un tono cálido, profesional, sereno y psicológicamente seguro (puedes llamarlo por su nombre, 'amigo', o hablar de forma directa y respetuosa).\n"
                "3. Escribe exactamente UNA o DOS oraciones concisas (15 a 25 palabras máximo).\n"
                "4. Enfatiza la calma, la evidencia, la respiración y el proceso de aprendizaje.\n"
                "5. Devuelve SOLO el texto plano para síntesis de voz, sin comillas ni asteriscos."
            )

            for model_name in ["gemini-flash-latest", "gemini-2.5-flash"]:
                try:
                    resp = self.client.models.generate_content(
                        model=model_name,
                        contents=f"Genera una frase de apoyo psicológico para la situación: {situation} (Nivel {level})",
                        config=genai_types.GenerateContentConfig(
                            system_instruction=sys_instruction,
                            temperature=0.85,
                            max_output_tokens=65
                        )
                    )
                    if resp and resp.text:
                        cleaned = resp.text.strip().replace('"', '').replace('*', '')
                        if cleaned and cleaned not in history:
                            return cleaned
                except Exception as e:
                    logger.info(f"Gemini {model_name} ocupado o no disponible ({e}), activando generador psicológico procedural.")
                    break

        # Fallback procedural psicológico garantizado sin piropos
        return self._generate_procedural_unique_speech(situation, level, history)

    def _generate_procedural_unique_speech(self, situation: str, level: int, history: list) -> str:
        """Generador procedural combinatorio de enfoque psicológico riguroso, sereno y sin piropos."""
        import random

        prefixes = [
            "Excelente deducción",
            "Mantén ese ritmo sereno",
            "Bien pensado",
            "Observo gran claridad mental",
            "Paso firme y seguro",
            "Buen análisis"
        ]
        prefix = random.choice(prefixes)

        actions = {
            "correct": [
                "identificaste con precisión el concepto clave. Tu razonamiento lógico está funcionando muy bien.",
                "conexión exacta. Cuando enfocas tu atención con calma, los patrones se revelan por sí solos.",
                "acierto fundamentado. Sigue confiando en tu análisis reflexivo, vas por excelente camino.",
                "respuesta correcta. Tu capacidad de relacionar ideas demuestra una comprensión sólida."
            ],
            "wrong": [
                "recuerda que un error es únicamente información, no define tu capacidad. Respira profundo y analiza otra opción.",
                "toma una pausa consciente. Los distractores suelen parecer lógicos; descartarlo te acerca a la respuesta verdadera.",
                "inmune a la frustración: cada descarte entrena tu criterio crítico. Revisa las premisas y volvamos a intentarlo.",
                "mantén la mente despejada. La equivocación es parte del aprendizaje activo; confía en tu razonamiento."
            ],
            "level_up": [
                f"has completado esta etapa con constancia mental. Tu cerebro se adapta con éxito al Nivel {level}.",
                f"ascendemos al Nivel {level}. Tu concentración sostenida está dando frutos muy claros.",
                f"excelente progreso cognitivo. Cada nivel superado refuerza tu seguridad y dominio sobre el tema."
            ],
            "hint": [
                "analiza la raíz del término: busca en tus cartas la función operativa principal que responda al reactivo.",
                "despeja la mente: elimina primero las opciones extremas y concéntrate en la definición central.",
                "respira y lee con atención: la clave está en el verbo principal de la pregunta."
            ],
            "welcome": [
                f"iniciamos el Nivel {level}. Mantén una respiración serena y confía plenamente en tu proceso analítico.",
                f"aquí estamos para avanzar con calma. Tu enfoque estructurado es tu mejor herramienta en este nivel."
            ],
            "victory": [
                "has completado todo el circuito demostrando equilibrio emocional y rigor analítico. Gran trabajo mental.",
                "prueba superada con excelencia. Mantuviste la serenidad y la claridad bajo presión intelectual."
            ]
        }

        act_list = actions.get(situation, actions["correct"])
        act = random.choice(act_list)

        if situation == "wrong":
            phrase = act
        else:
            phrase = f"{prefix}: {act}"

        if phrase in history:
            phrase += " Respira con calma y continúa."

        return phrase


ai_service = AIService()


