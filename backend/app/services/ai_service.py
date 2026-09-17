import json
import logging
from typing import Dict, Any
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger("hubzy.ai_service")

# Prompt de sistema estructurado para forzar respuesta JSON limpia
SYSTEM_INSTRUCTION = """
Eres un profesor universitario experto y pedagogo de la plataforma educativa Hubzy.
Tu objetivo es transformar textos densos de estudio en elementos de juego anti-estrés pedagógicos.

INSTRUCCIONES ESTRICTAS:
1. Extrae exactamente 5 conceptos clave representativos del texto proporcionado.
2. Para cada concepto genera:
   - "concept_name": Nombre exacto y conciso del término/concepto.
   - "content": Breve explicación didáctica (máximo 2 líneas, comprensible y clara).
   - "points_multiplier": Asigna "1x", "2x" o "3x" según la dificultad relativa del concepto.
   - "node_hint": Una pista pedagógica descriptiva para el nodo donde encajará la carta, SIN mencionar el nombre del concepto directamente.
3. Propón un "title" pedagógico y atractivo para el tablero de estudio.
4. DEBES RESPONDER ÚNICAMENTE con un objeto JSON válido, sin bloques de markdown (` ```json `), sin introducciones ni textos anexos.

Estructura JSON requerida:
{
  "title": "Título del Tablero",
  "concepts": [
    {
      "concept_name": "...",
      "content": "...",
      "points_multiplier": "1x",
      "node_hint": "..."
    }
  ]
}
"""

class AIService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                generation_config={
                    "temperature": 0.3,
                    "response_mime_type": "application/json"
                },
                system_instruction=SYSTEM_INSTRUCTION
            )
        else:
            self.model = None
            logger.warning("GEMINI_API_KEY no encontrada. Modo Mock activado para pruebas locales.")

    def extract_concepts_from_text(self, study_text: str) -> Dict[str, Any]:
        """
        Envía el texto a Gemini con prompt estructurado y parsea el JSON resultante.
        Si no hay API key configurada o ocurre un fallo recuperable, provee un fallback estructurado.
        """
        if not self.model:
            return self._get_fallback_mock_data(study_text)

        prompt = f"Analiza el siguiente texto de estudio y extrae los 5 conceptos clave:\n\n{study_text}"

        try:
            response = self.model.generate_content(prompt)
            raw_text = response.text.strip()
            
            # Limpieza defensiva en caso de que venga envuelto en markdown
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            raw_text = raw_text.strip()

            parsed_json = json.loads(raw_text)
            return parsed_json

        except json.JSONDecodeError as jde:
            logger.error(f"Error parseando JSON de Gemini: {jde} | Contenido recibido: {raw_text}")
            raise ValueError(f"La IA no devolvió un formato JSON válido: {str(jde)}")
        except Exception as e:
            logger.error(f"Error invocando la API de Google Gemini: {e}")
            raise RuntimeError(f"Error de comunicación con el motor de IA: {str(e)}")

    def _get_fallback_mock_data(self, study_text: str) -> Dict[str, Any]:
        """Fallback pedagógico de alta calidad para desarrollo y tests sin consumir cuota."""
        return {
            "title": "Tablero de Aprendizaje Zen (Modo Simulación)",
            "concepts": [
                {
                    "concept_name": "Mitocondria",
                    "content": "Central energética de la célula encargada de sintetizar ATP.",
                    "points_multiplier": "1x",
                    "node_hint": "Organelo donde se genera la mayor reserva energética de la célula."
                },
                {
                    "concept_name": "Ribosoma",
                    "content": "Complejo molecular responsable de la traducción y síntesis de proteínas.",
                    "points_multiplier": "2x",
                    "node_hint": "Fábrica celular donde el ARN mensajero se transforma en cadenas proteicas."
                },
                {
                    "concept_name": "Aparato de Golgi",
                    "content": "Modifica, empaqueta y distribuye proteínas hacia su destino final.",
                    "points_multiplier": "1x",
                    "node_hint": "Centro logístico celular que envía vesículas al interior y exterior."
                },
                {
                    "concept_name": "Núcleo Celular",
                    "content": "Estructura membranosa que custodia y replica el ADN cromosómico.",
                    "points_multiplier": "2x",
                    "node_hint": "Bóveda de información genética y control maestro de la actividad celular."
                },
                {
                    "concept_name": "Membrana Plasmática",
                    "content": "Bicapa lipídica que regula de forma selectiva el intercambio de sustancias.",
                    "points_multiplier": "3x",
                    "node_hint": "Barrera protectora semipermeable que delimita y comunica a la célula."
                }
            ]
        }

ai_service = AIService()
