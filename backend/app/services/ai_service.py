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

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    Groq = None
    GROQ_AVAILABLE = False

from app.core.config import settings

logger = logging.getLogger("hubzy.ai_service")

# Modelos ultrarrápidos de Groq
GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]

# Directivas pedagógicas y de progresión curricular a lo largo del documento (100% de cobertura)
LEVEL_DESCRIPTIONS = {
    1: {
        "name": "Fácil",
        "questions": 3,
        "difficulty": "facil",
        "doc_sector": "Sector Inicial (0% al 25% del texto: Introducción, Objetivos Generales, Definición Central y Alcance)",
        "guideline": (
            "NIVEL 1 - FÁCIL: Enfócate en el SECTOR INICIAL del documento (0% al 25%). "
            "Las preguntas deben ser directas y fundacionales: definiciones centrales, propósito del plan/texto y conceptos rectoriales."
        )
    },
    2: {
        "name": "Semi-normal",
        "questions": 5,
        "difficulty": "seminormal",
        "doc_sector": "Sector Estructural (25% al 50% del texto: Fundamentos, Estructura, Roles, Procedimientos iniciales)",
        "guideline": (
            "NIVEL 2 - SEMI-NORMAL: Enfócate en el PRIMER TERCIO/MITAD del documento (25% al 50%). "
            "Preguntas sobre organización, roles, etapas iniciales, requisitos y normas de operación explicadas en esta sección."
        )
    },
    3: {
        "name": "Normal",
        "questions": 8,
        "difficulty": "normal",
        "doc_sector": "Sector Central y Técnico (45% al 70% del texto: Metodologías, Algoritmos, Actividades, Fases de Ejecución)",
        "guideline": (
            "NIVEL 3 - NORMAL: Enfócate en la ZONA MEDIA del documento (45% al 70%). "
            "Preguntas de aplicación metodológica, fases técnicas, relación causa-efecto y taxonomías detalladas en el núcleo del texto."
        )
    },
    4: {
        "name": "Semi-difícil",
        "questions": 15,
        "difficulty": "semidificil",
        "doc_sector": "Sector Avanzado y de Control (65% al 85% del texto: Métricas, Gestión de Riesgos, Control de Calidad y Casos)",
        "guideline": (
            "NIVEL 4 - SEMI-DIFÍCIL: Enfócate en la SECCIÓN AVANZADA del documento (65% al 85%). "
            "Preguntas de análisis crítico, estándares de verificación, criterios de aceptación, métricas cuantitativas y contingencias."
        )
    },
    5: {
        "name": "Difícil",
        "questions": 20,
        "difficulty": "dificil",
        "doc_sector": "Sector Final y Síntesis Holística (75% al 100% del texto: Auditorías, Conclusiones, Entregables y Síntesis Total)",
        "guideline": (
            "NIVEL 5 - DIFÍCIL: Enfócate en las SECCIONES FINALES (75% al 100%) combinadas con una SÍNTESIS INTEGRAL de todo el documento. "
            "Preguntas exhaustivas, distinciones de alta precisión, dictámenes finales, criterios de validación y conclusiones."
        )
    }
}


def build_system_instruction(
    question_count: int = 5, 
    difficulty: str = "normal", 
    level: int = 1,
    excluded_concepts: Optional[List[str]] = None
) -> str:
    """Construye las instrucciones dinámicas de Gemini/Groq con exclusión estricta de conceptos previos y cobertura sectorizada."""
    distractor_count = max(1, round(question_count * 0.30))
    lvl_info = LEVEL_DESCRIPTIONS.get(level, LEVEL_DESCRIPTIONS[1])
    guideline = lvl_info["guideline"]
    doc_sector = lvl_info.get("doc_sector", "Todo el documento")

    exclusion_clause = ""
    if excluded_concepts and len(excluded_concepts) > 0:
        clean_excluded = [f'"{c.strip()}"' for c in excluded_concepts if c and len(c.strip()) > 1][:50]
        if clean_excluded:
            exclusion_clause = f"""
🚫 PROHIBICIÓN ESTRICTA DE REPETICIÓN (CONCEPTOS YA EVALUADOS EN NIVELES ANTERIORES):
Los siguientes conceptos ya fueron aprendidos y superados por el estudiante en niveles anteriores:
[{', '.join(clean_excluded)}]
- ESTÁ TERMINANTEMENTE PROHIBIDO generar preguntas cuyas respuestas o conceptos ("concept_name") sean idénticos o sinónimos directos de los conceptos listados arriba.
- DEBES extraer conceptos NUEVOS, DISTINTOS y NO EVALUADOS AÚN a partir del sector correspondiente del texto.
"""

    return f"""
Eres un evaluador pedagógico de élite universitaria encargado de diseñar simulacros de examen profesionales en Hubzy.
Tu objetivo es que el estudiante domine y asimile el 100% DEL DOCUMENTO ACADÉMICO a través de sus 5 niveles progresivos.

🎯 ZONA PRIORITARIA DEL DOCUMENTO PARA ESTE NIVEL ({level}/5):
{doc_sector}

{guideline}
{exclusion_clause}

⚠️ REGLAS OBLIGATORIAS:
1. ÚNICAMENTE extrae información, citas y conceptos EXPLÍCITAMENTE presentes en el texto proporcionado.
2. NUNCA alucines o traigas conocimiento externo que no esté en el documento.
3. Para cada uno de los {question_count} reactivos requeridos genera:
   - "concept_name": Término o principio técnico exacto (la carta en mano del estudiante, máximo 4 palabras).
   - "content": Explicación sintética y precisa fundamentada en el texto (1-2 líneas).
   - "source_quote": Cita textual exacta de 1 renglón extraída del texto que respalda y valida la respuesta.
   - "points_multiplier": "1x" (nivel 1-2), "2x" (nivel 3), "3x" (nivel 4-5).
   - "node_question": Reactivo de examen riguroso, claro y desafiante adecuado al nivel {level}.
   - "node_hint": Pista conceptual orientadora que ayude al alumno sin revelar el nombre exacto de la carta.

🎭 CARTAS DISTRACTORAS ({distractor_count} DISTRACTORES TEMÁTICOS CONTEXTUALES):
- Genera exactamente {distractor_count} conceptos distractores.
- REGLA CRÍTICA DE DISTRACTORES: Los distractores DEBEN pertenecer al MISMO CAMPO TEMÁTICO y vocabulario del documento (conceptos verosímiles o doctrinas afines pero incorrectas para esa pregunta puntual).
- PROHIBIDO usar distractores de áreas no relacionadas (por ejemplo, si el tema es un plan de administración de software, los distractores deben ser de gestión o ingeniería de software, NO de medicina, física cuántica ni redes no vinculadas).

⚖️ DISTRIBUCIÓN EQUITATIVA SI HAY MÚLTIPLES ARCHIVOS:
- Si el texto contiene delimitadores '--- DOCUMENTO: [Nombre] ---', distribuye los reactivos equitativamente entre los diferentes documentos para que la evaluación abarque todo el material de estudio y no solo el primer archivo.

Estructura JSON requerida (responde ÚNICAMENTE con JSON válido):
{{
  "title": "Simulacro: [Tema Real del Texto]",
  "level": {level},
  "difficulty": "{difficulty}",
  "concepts": [
    {{
      "concept_name": "Término Técnico 1",
      "content": "Fundamentación extraída del texto...",
      "source_quote": "Cita textual del texto que respalda esto...",
      "points_multiplier": "1x",
      "node_question": "¿Según el documento, qué establece...?",
      "node_hint": "Revisa la sección donde se explica..."
    }}
  ],
  "distractors": [
    {{
      "concept_name": "Distractor Temático Verosímil 1",
      "content": "Concepto de la materia no aplicable a estos reactivos.",
      "points_multiplier": "1x"
    }}
  ]
}}
"""ímil 1",
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
        self.groq_client = None

        # Groq Client (Ultra fast inference)
        if GROQ_AVAILABLE and settings.GROQ_API_KEY:
            try:
                self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
                logger.info("Groq Cloud client inicializado correctamente para respuestas ultrarrápidas.")
            except Exception as e:
                self.groq_client = None
                logger.warning(f"No se pudo inicializar Groq Client: {e}")

        # Google Gemini Client
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
        level: int = 1,
        excluded_concepts: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Envía el texto REAL del documento a Gemini con prompt estructurado
        y parsea el JSON resultante para generar preguntas dinámicas de examen
        calibradas exactamente al nivel (1 a 5), dificultad y número de preguntas,
        excluyendo conceptos de niveles anteriores para garantizar no-repetición.
        """
        if not self.groq_client and not self.client:
            raise RuntimeError(
                "Ni GROQ_API_KEY ni GEMINI_API_KEY están configuradas en el servidor. "
                "Agrega al menos una clave en el archivo .env para procesar el material dinámicamente con IA."
            )

        # Analizar el documento COMPLETO sin truncar arbitrariamente (hasta 500k caracteres)
        full_text = study_text[:500000] if len(study_text) > 500000 else study_text

        dynamic_sys_instruction = build_system_instruction(
            question_count=question_count,
            difficulty=difficulty,
            level=level,
            excluded_concepts=excluded_concepts
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

        # =====================================================================
        # 1. PRIORIDAD: GROQ (Velocidad ultrarrápida / baja latencia ~300+ tok/s)
        # =====================================================================
        if self.groq_client:
            for g_model in GROQ_MODELS:
                try:
                    logger.info(f"⚡ Invocando Groq ultrarrápido con modelo '{g_model}' (nivel: {level}, {question_count} preguntas)...")
                    chat_completion = self.groq_client.chat.completions.create(
                        model=g_model,
                        messages=[
                            {"role": "system", "content": dynamic_sys_instruction},
                            {"role": "user", "content": prompt}
                        ],
                        response_format={"type": "json_object"},
                        temperature=0.85 if variation_seed > 0 else 0.3,
                        timeout=8.0,
                    )
                    raw_text = (chat_completion.choices[0].message.content or "").strip()
                    parsed_json = json.loads(raw_text)
                    logger.info(f"⚡ Reactivos generados exitosamente con Groq ({g_model}) a máxima velocidad.")
                    return parsed_json
                except Exception as ge:
                    logger.warning(f"Groq ({g_model}) falló o alcanzó límite: {ge}. Intentando siguiente...")

        # =====================================================================
        # 2. FALLBACK: GOOGLE GEMINI
        # =====================================================================
        if not self.client:
            raise RuntimeError("Groq falló y Gemini no está configurado.")

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

                # Limpieza y reparación defensiva de JSON
                parsed_json = None
                cleaned = raw_text
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                if cleaned.startswith("```"):
                    cleaned = cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()

                try:
                    parsed_json = json.loads(cleaned)
                except json.JSONDecodeError:
                    # Intento de auto-reparación defensiva (cierre de llaves o corchetes faltantes)
                    try:
                        # Extraer el bloque JSON más exterior
                        start_idx = cleaned.find("{")
                        if start_idx != -1:
                            sub = cleaned[start_idx:]
                            # Si se cortó en medio de una cadena o array, intentar equilibrar llaves
                            open_braces = sub.count("{") - sub.count("}")
                            open_brackets = sub.count("[") - sub.count("]")
                            repaired = sub + ("]" * max(0, open_brackets)) + ("}" * max(0, open_braces))
                            parsed_json = json.loads(repaired)
                    except Exception:
                        pass

                if not parsed_json or not isinstance(parsed_json, dict):
                    raise json.JSONDecodeError("JSON no válido o no diccionario", raw_text, 0)

                logger.info(f"Reactivos generados exitosamente con modelo '{model_name}'.")
                return parsed_json

            except json.JSONDecodeError as jde:
                logger.error(f"Error parseando JSON de Gemini ({model_name}): {jde} | Contenido: {raw_text[:500]}")
                last_error = ValueError(f"La IA ({model_name}) no devolvió un formato JSON válido: {str(jde)}")
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
                from pypdf.errors import PdfReadError, FileNotDecryptedError
                reader = PdfReader(io.BytesIO(file_bytes))
                
                # Verificar si el PDF está protegido con contraseña
                if reader.is_encrypted:
                    try:
                        reader.decrypt("")
                    except Exception:
                        raise RuntimeError("El archivo PDF está protegido con contraseña. Por favor, sube una versión desbloqueada.")

                pages = []
                for p in reader.pages:
                    t = p.extract_text()
                    if t:
                        pages.append(t)
                pdf_text = "\n\n".join(pages).strip()
            except (PdfReadError, FileNotDecryptedError) as pfe:
                logger.warning(f"PDF encriptado o dañado en '{filename}': {pfe}")
                raise RuntimeError("El archivo PDF está protegido con contraseña o dañado. Por favor, sube un archivo legible.")
            except Exception as pe:
                logger.warning(f"Extracción directa pypdf falló para '{filename}': {pe}")

            # Si se obtuvo texto nativo suficiente, retornarlo de inmediato (0 costo y milisegundos)
            if len(pdf_text) >= 50:
                logger.info(f"Extracción nativa pypdf exitosa para '{filename}': {len(pdf_text)} caracteres")
                return pdf_text

            # Si el PDF es escaneado (sin capa de texto), activar OCR Multimodal con Gemini
            logger.info(f"PDF '{filename}' parece ser escaneado o imagen (longitud {len(pdf_text)}). Activando OCR Multimodal Gemini...")
            return self.extract_text_multimodal_ocr(file_bytes, "application/pdf")

        # 2. DOCUMENTOS WORD (.docx)
        if lower_name.endswith(".docx"):
            try:
                import io
                import docx
                doc = docx.Document(io.BytesIO(file_bytes))
                full_paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
                for table in doc.tables:
                    for row in table.rows:
                        full_paragraphs.append(" | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()]))
                docx_text = "\n".join(full_paragraphs).strip()
                if len(docx_text) >= 20:
                    return docx_text
            except Exception as docx_err:
                logger.warning(f"Error procesando .docx '{filename}': {docx_err}")

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

        # 1. Intentar primero con Groq (latencia prácticamente instantánea ~80ms)
        if self.groq_client:
            for g_model in ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"]:
                try:
                    sys_instruction = (
                        "Eres Capi: un psicólogo cognitivo sereno, empático, profesional y reconfortante. "
                        "Tu objetivo es reducir la ansiedad ante exámenes y optimizar el rendimiento del estudiante.\n"
                        f"NIVEL COGNITIVO: Nivel {level}/5. Enfoque: {psy_desc}\n"
                        f"SITUACIÓN: {sit_desc}\n"
                        f"TEMA DE ESTUDIO: '{theme or 'Materia'}'\n"
                        f"{avoid_clause}\n"
                        "REGLAS OBLIGATORIAS:\n"
                        "1. NO uses piropos ni apelativos empalagosos.\n"
                        "2. Mantén un tono cálido, profesional, sereno y psicológicamente seguro.\n"
                        "3. Escribe exactamente UNA o DOS oraciones concisas (15 a 25 palabras máximo).\n"
                        "4. Devuelve SOLO el texto plano para síntesis de voz, sin comillas ni asteriscos."
                    )
                    chat_comp = self.groq_client.chat.completions.create(
                        model=g_model,
                        messages=[
                            {"role": "system", "content": sys_instruction},
                            {"role": "user", "content": f"Genera una frase de apoyo para la situación: {situation} (Nivel {level})"}
                        ],
                        max_tokens=65,
                        temperature=0.85
                    )
                    content = (chat_comp.choices[0].message.content or "").strip().replace('"', '').replace('*', '')
                    if content and content not in history:
                        return content
                except Exception as ge:
                    logger.debug(f"Groq speech ({g_model}) no disponible: {ge}")

        # 2. Respaldo con Gemini
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


