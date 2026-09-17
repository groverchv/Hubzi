import json
import logging
from typing import Dict, Any

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

# Prompt de sistema: genera preguntas dinámicas SOLO del contenido provisto, sin fuentes externas
SYSTEM_INSTRUCTION = """
Eres un evaluador académico universitario experto y diseñador de simulacros de examen en la plataforma Hubzy.

⚠️ REGLA ABSOLUTA — SIN EXCEPCIONES:
- ÚNICAMENTE debes analizar y formular preguntas a partir del texto que se te proporciona en este mensaje.
- ESTÁ TERMINANTEMENTE PROHIBIDO usar conocimiento propio, enciclopédico, de internet, de otros documentos o de entrenamiento previo.
- Si el texto no contiene información suficiente sobre un concepto, NO lo incluyas. Trabaja SOLO con lo que está escrito.
- Las preguntas deben provenir de párrafos, definiciones, fórmulas, procedimientos o casos concretos extraídos del texto suministrado.

CRITERIOS PEDAGÓGICOS (aplicar SOLO al contenido del texto recibido):
1. Extrae exactamente 5 conceptos, principios, fórmulas, procedimientos o tesis presentes EXPLÍCITAMENTE en el texto.
2. Para cada concepto genera:
   - "concept_name": El término técnico exacto tal como aparece en el documento (la carta respuesta del alumno).
   - "content": Síntesis de 1-2 líneas que explica POR QUÉ es la respuesta correcta, usando el lenguaje del propio documento.
   - "points_multiplier": "1x" (conceptual), "2x" (aplicación), "3x" (caso complejo de integración).
   - "node_question": REACTIVO DE EXAMEN REAL basado en un párrafo o idea del documento. Puede ser: definición rigurosa, caso práctico, completación de concepto, o análisis crítico. Ejemplo de formato: "¿Qué principio del texto establece que...?" o "Según el documento analizado, ¿cuál es el criterio para...?". JAMÁS generes algo como "Pregunta sobre [nombre de archivo]" o frases genéricas.
   - "node_hint": Pista nemotécnica que guíe al alumno hacia la respuesta SIN revelarla, usando referencias al texto.
3. El "title" debe reflejar el tema central que REALMENTE aparece en el texto: ej. "Simulacro: Principios de Contabilidad Financiera".
4. RESPONDE ÚNICAMENTE con el objeto JSON válido, sin delimitadores markdown ni texto adicional.

Estructura JSON requerida:
{
  "title": "Simulacro de Examen: [Tema Real del Texto]",
  "concepts": [
    {
      "concept_name": "Término Técnico del Documento",
      "content": "Fundamentación extraída del texto...",
      "points_multiplier": "2x",
      "node_question": "¿Según el documento, qué establece [concepto] respecto a...?",
      "node_hint": "Revisa la sección del texto donde se explica [referencia directa]..."
    }
  ]
}
"""

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

    def extract_concepts_from_text(self, study_text: str, variation_seed: int = 0) -> Dict[str, Any]:
        """
        Envía el texto REAL del documento a Gemini con prompt estructurado
        y parsea el JSON resultante para generar preguntas dinámicas de examen.
        No utiliza datos estáticos ni simulaciones.
        Implementa fallback automático entre modelos Gemini si alguno supera cuotas (429) o congestión (503).
        Si variation_seed > 0, exige preguntas y conceptos totalmente diferentes a los anteriores.
        """
        if not self.client:
            raise RuntimeError(
                "GEMINI_API_KEY no está configurada en el servidor. "
                "Agrega la clave en el archivo .env para procesar el material dinámicamente con IA."
            )

        # Analizar el documento COMPLETO sin truncar arbitrariamente (hasta 500k caracteres)
        full_text = study_text[:500000] if len(study_text) > 500000 else study_text

        variation_directive = ""
        if variation_seed > 0:
            variation_directive = (
                f"\n\n🚨 INSTRUCCIÓN DE REINICIO DE PARTIDA (RONDA #{variation_seed}):\n"
                f"- El usuario ha reiniciado la partida. ESTÁ TERMINANTEMENTE PROHIBIDO repetir preguntas anteriores.\n"
                f"- Formula 5 preguntas y conceptos clave COMPLETAMENTE DIFERENTES basados en otras secciones, definiciones, procedimientos o fórmulas del texto.\n"
                f"- Varía la profundidad pedagógica (análisis crítico, casos prácticos y definiciones precisas de otras partes del documento)."
            )

        prompt = (
            f"Analiza exhaustivamente TODO el contenido del siguiente documento académico completo "
            f"(abarca todos sus temas, secciones, definiciones y procedimientos de inicio a fin){variation_directive}\n\n"
            f"Texto del documento:\n{full_text}"
        )

        last_error = None
        for model_name in GEMINI_FALLBACK_MODELS:
            try:
                logger.info(f"Invocando Gemini con modelo '{model_name}' (seed: {variation_seed})...")
                # thinking_budget=0 desactiva la latencia de razonamiento innecesaria y responde en ~1.5s
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=SYSTEM_INSTRUCTION,
                        temperature=0.85 if variation_seed > 0 else 0.4,
                        response_mime_type="application/json",
                        thinking_config=genai_types.ThinkingConfig(thinking_budget=0) if hasattr(genai_types, 'ThinkingConfig') else None,
                # Configuración optimizada (intentar thinking_budget=0 para modelos que lo admiten)
                config_kwargs = {
                    "system_instruction": SYSTEM_INSTRUCTION,
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
                )
                except Exception as call_err:
                    # Fallback sin thinking_config si el modelo no soporta ese parámetro
                    logger.warning(f"Error inicial con {model_name}: {call_err}. Reintentando con configuración estándar...")
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=genai_types.GenerateContentConfig(
                            system_instruction=SYSTEM_INSTRUCTION,
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
                logger.warning(f"No se pudo decodificar archivo de texto '{filename}': {de}")
                return ""


ai_service = AIService()

