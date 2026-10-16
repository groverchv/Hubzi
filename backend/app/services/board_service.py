"""
Servicio de generación de tableros de juego.
Extraído de main.py: lógica de caché L1 (RAM) / L2 (MongoDB) + pipeline IA + Builder.
"""
import hashlib
import logging
from typing import Optional, Dict, Any

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.database import db_manager
from app.core.security import utcnow_iso
from app.schemas.schemas import GameBoardResponse, GenerateBoardRequest
from app.services.ai_service import ai_service
from app.builders.builder import GameBoardBuilder

logger = logging.getLogger("hubzy.board_service")

# Caché L1 en memoria RAM (sub-milisegundo, capacidad para 200 tableros recientes)
L1_RAM_CACHE: Dict[str, Any] = {}
L1_CACHE_MAX_SIZE = 200


def get_from_l1_cache(signature_hash: str) -> Optional[GameBoardResponse]:
    return L1_RAM_CACHE.get(signature_hash)


def save_to_l1_cache(signature_hash: str, board: GameBoardResponse):
    if len(L1_RAM_CACHE) >= L1_CACHE_MAX_SIZE:
        try:
            oldest_key = next(iter(L1_RAM_CACHE))
            del L1_RAM_CACHE[oldest_key]
        except Exception:
            pass
    L1_RAM_CACHE[signature_hash] = board


async def generate_board(
    payload: GenerateBoardRequest,
    force_refresh: bool = False,
    variation_seed: int = 0,
    user_id: Optional[str] = None,
) -> GameBoardResponse:
    """
    Pipeline completo: hash del contenido → caché L1/L2 → Gemini → Builder →
    persistencia (game_boards, cached_analyses, ai_training_dataset).
    """
    level = getattr(payload, 'level', 1) or 1
    question_count = getattr(payload, 'question_count', 3) or 3
    difficulty = getattr(payload, 'difficulty', 'facil') or 'facil'
    excluded_concepts = getattr(payload, 'excluded_concepts', []) or []

    excl_signature = ",".join(sorted(excluded_concepts)) if excluded_concepts else "none"
    cache_signature = f"{payload.text.strip()}_lvl{level}_qc{question_count}_{difficulty}_excl_{excl_signature}"
    content_hash = hashlib.sha256(cache_signature.encode("utf-8")).hexdigest()

    if not force_refresh:
        l1_hit = get_from_l1_cache(content_hash)
        if l1_hit:
            logger.info(f"⚡⚡ [CACHE L1 - RAM HIT] ({content_hash[:8]}...): Tablero servido en sub-milisegundos desde memoria.")
            return l1_hit

    if not force_refresh and db_manager.db is not None:
        try:
            cached_doc = await db_manager.db["cached_analyses"].find_one({"content_hash": content_hash})
            if cached_doc and "board" in cached_doc:
                logger.info(f"⚡ [CACHE L2 - MONGODB HIT] ({content_hash[:10]}... Nivel {level}, {question_count} reactivos): Tablero cargado desde caché en MongoDB.")
                board_obj = GameBoardResponse(**cached_doc["board"])
                save_to_l1_cache(content_hash, board_obj)
                return board_obj
        except Exception as ce:
            logger.warning(f"Error consultando caché de análisis: {ce}")

    try:
        ai_data = ai_service.extract_concepts_from_text(
            payload.text,
            variation_seed=variation_seed,
            question_count=question_count,
            difficulty=difficulty,
            level=level,
            excluded_concepts=excluded_concepts
        )

        concepts = ai_data.get("concepts", [])
        if not concepts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudieron identificar conceptos válidos en el texto provisto."
            )

        builder = GameBoardBuilder(title=ai_data.get("title", "Tablero de Aprendizaje"))

        seen_names = set()
        for idx, item in enumerate(concepts, start=1):
            card_id = f"card_{idx}"
            node_id = f"node_{idx}"
            raw_cname = (item.get("concept_name") or f"Concepto {idx}").strip()
            cname = raw_cname[:38].strip()
            if cname in seen_names:
                cname = f"{cname} ({idx})"
            seen_names.add(cname)

            builder.add_card(
                card_id=card_id,
                concept_name=cname,
                content=item.get("content", ""),
                points_multiplier=item.get("points_multiplier", "1x")
            )

            builder.add_node(
                node_id=node_id,
                correct_card_id=card_id,
                description=item.get("node_hint", f"Pista para el concepto {idx}"),
                question=item.get("node_question", None)
            )

        # REGLA: 30% del total de preguntas como cartas distractoras
        distractor_count = max(1, round(len(concepts) * 0.30))
        ai_distractors = ai_data.get("distractors", [])

        for d_idx in range(distractor_count):
            card_id = f"card_distractor_{d_idx + 1}"
            if d_idx < len(ai_distractors) and ai_distractors[d_idx].get("concept_name"):
                d_item = ai_distractors[d_idx]
                raw_dname = (d_item.get("concept_name") or f"Distractor {d_idx + 1}").strip()
                concept_name = raw_dname[:38].strip()
                if concept_name in seen_names:
                    concept_name = f"{concept_name} (Alt)"
                content = d_item.get("content", "Concepto distractor no aplicable a los reactivos planteados.")
                mult = d_item.get("points_multiplier", "1x")
            else:
                concept_name = f"Enfoque Alternativo {d_idx + 1}"
                content = "Concepto no correspondiente a las preguntas del circuito."
                mult = "1x"
            seen_names.add(concept_name)

            builder.add_card(
                card_id=card_id,
                concept_name=concept_name,
                content=content,
                points_multiplier=mult
            )

        board_result = builder.build()

        if db_manager.db is not None:
            try:
                mat_doc = {
                    "content_hash": content_hash,
                    "text_preview": payload.text[:300],
                    "text_length": len(payload.text),
                    "user_id": user_id,
                    "created_at": utcnow_iso(),
                    "status": "processed"
                }
                await db_manager.db["study_materials"].insert_one(mat_doc)

                board_dict = {
                    "id_tablero": board_result.id_tablero,
                    "title": board_result.title,
                    "nodes": [n.model_dump() for n in board_result.nodes],
                    "cards": [c.model_dump() for c in board_result.cards],
                    "created_at": utcnow_iso()
                }
                await db_manager.db["game_boards"].insert_one(board_dict)
                logger.info(f"Tablero {board_result.id_tablero} guardado en MongoDB con éxito.")

                await db_manager.db["cached_analyses"].update_one(
                    {"content_hash": content_hash},
                    {"$set": {
                        "content_hash": content_hash,
                        "title": board_result.title,
                        "board": board_dict,
                        "ai_data": ai_data,
                        "updated_at": utcnow_iso()
                    }},
                    upsert=True
                )
                logger.info(f"Tablero {board_result.id_tablero} guardado en MongoDB y en caché para reutilización futura.")
                save_to_l1_cache(content_hash, board_result)

                # DATASET HUBZY: pares de entrenamiento para futuro fine-tuning
                training_samples = []
                for node in board_result.nodes:
                    correct_card = next((c for c in board_result.cards if c.id == node.correct_card_id), None)
                    if correct_card:
                        training_samples.append({
                            "question": node.question,
                            "hint": node.description,
                            "target_concept": correct_card.concept_name,
                            "explanation": correct_card.content,
                            "multiplier": correct_card.points_multiplier
                        })
                if training_samples:
                    await db_manager.db["ai_training_dataset"].insert_one({
                        "content_hash": content_hash,
                        "level": level,
                        "difficulty": difficulty,
                        "document_context_sample": payload.text[:1000],
                        "samples": training_samples,
                        "source_title": board_result.title,
                        "quality_score": 1.0,
                        "created_at": utcnow_iso()
                    })
                    logger.info(f"🎓 {len(training_samples)} ejemplos pedagógicos archivados para el dataset de entrenamiento.")
            except Exception as dbe:
                logger.warning(f"Error guardando tablero en MongoDB: {dbe}")

        return board_result

    except HTTPException:
        raise
    except ValueError as ve:
        logger.warning(f"Error de formato IA: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except RuntimeError as re:
        logger.error(f"Error en comunicación con LLM: {re}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(re)
        )
    except Exception as ex:
        logger.error(f"Error inesperado procesando arena: {ex}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error inesperado al generar el tablero de juego."
        )
