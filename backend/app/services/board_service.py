"""
Servicio de generación de tableros de juego.
Extraído de main.py: lógica de caché L1 (RAM) / L2 (MongoDB) + pipeline IA + Builder.
"""
import hashlib
import logging
from typing import Optional, Dict, Any

from fastapi import HTTPException, status

from app.core.age_bands import get_band, resolve_level_question_count
from app.core.config import settings
from app.core.database import db_manager
from app.core.security import utcnow_iso
from app.schemas.schemas import AnswerSpec, GameBoardResponse, GenerateBoardRequest
from app.services.ai_service import ai_service
from app.services.domain_engine import classify_domain, detect_math_topics
from app.services.math_engine import generate_math_problems
from app.services.physics_engine import generate_physics_problems
from app.services.safety_filter import filter_board_for_band
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


def _build_solve_board(problems: list, band_key: str, domain: str,
                       title: str) -> GameBoardResponse:
    """
    Ensambla problemas {question, correct, distractors, ...} en un tablero
    de arquetipo 'solve': carta = respuesta, nodo = problema.
    Compartido por el motor matemático y el de física (ambos procedurales).
    """
    band = get_band(band_key)
    builder = GameBoardBuilder(title=title)
    builder.set_meta(domain=domain, age_band=band_key)

    distractor_pool = []
    for idx, p in enumerate(problems, start=1):
        card_id, node_id = f"card_{idx}", f"node_{idx}"
        builder.add_card(
            card_id=card_id,
            concept_name=p["correct"],
            content=p.get("explanation") or f"Respuesta de {p['concept']}",
            points_multiplier="2x" if p.get("topic") in ("algebra", "trigonometria", "energía cinética") else "1x",
        )
        builder.add_node(
            node_id=node_id,
            correct_card_id=card_id,
            description=p.get("hint") or f"Resuelve el problema de {p['concept']}",
            question=p["question"],
            question_latex=p.get("question_latex"),
            answer_spec=AnswerSpec(
                type="solve",
                value=p["correct"],
                latex=p.get("question_latex"),
                topic=p.get("topic"),
                misconceptions=p.get("misconception_tags"),
                hint=p.get("hint"),
                explanation=p.get("explanation"),
            ),
        )
        distractor_pool.extend(p.get("distractors", []))

    # Distractores como cartas trampa — limitados por la banda de edad
    trap_budget = band.get("trap_count")
    n_traps = trap_budget if trap_budget is not None else max(1, round(len(problems) * 0.3))
    seen_answers = {p["correct"] for p in problems}
    used = set()
    d_idx = 0
    for val in distractor_pool:
        if d_idx >= n_traps or str(val) in seen_answers or val in used:
            continue
        used.add(val)
        d_idx += 1
        builder.add_card(
            card_id=f"card_distractor_{d_idx}",
            concept_name=str(val),
            content="Respuesta distractora — cuidado, es un error muy común.",
            points_multiplier="1x",
        )

    return builder.build()


def _build_math_board(payload: GenerateBoardRequest, band_key: str,
                      level: int, question_count: int,
                      variation_seed: int = 0) -> GameBoardResponse:
    """
    Tablero de matemática procedural (0 tokens, verificación exacta,
    distractores = misconcepciones reales de estudiantes).
    """
    topics = detect_math_topics(payload.text)
    seed = payload.level * 7919 + len(payload.text) + variation_seed * 104729
    problems = generate_math_problems(topics, band_key, level, question_count, seed=seed)
    if not problems:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudieron generar problemas de matemática para este material."
        )
    return _build_solve_board(problems, band_key, "matematica", "Circuito de Matemática")


def _build_physics_board(payload: GenerateBoardRequest, band_key: str,
                         level: int, question_count: int,
                         variation_seed: int = 0) -> GameBoardResponse:
    """Tablero de física procedural (magnitudes, unidades, fórmulas, conversiones)."""
    seed = payload.level * 104723 + len(payload.text) + variation_seed * 7919
    problems = generate_physics_problems(band_key, level, question_count, seed=seed)
    if not problems:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudieron generar problemas de física para este material."
        )
    return _build_solve_board(problems, band_key, "fisica", "Circuito de Física")


async def generate_board(
    payload: GenerateBoardRequest,
    force_refresh: bool = False,
    variation_seed: int = 0,
    user_id: Optional[str] = None,
) -> GameBoardResponse:
    """
    Pipeline completo: hash del contenido → caché L1/L2 → motor por dominio →
    Builder → persistencia (game_boards, cached_analyses, ai_training_dataset).

    Dominio 'matematica' → motor procedural (0 tokens, verificación exacta).
    Otros dominios → Gemini/Groq con contexto de edad inyectado en el prompt.
    """
    level = getattr(payload, 'level', 1) or 1
    difficulty = getattr(payload, 'difficulty', 'facil') or 'facil'
    excluded_concepts = getattr(payload, 'excluded_concepts', []) or []
    band_key = getattr(payload, 'age_band', None) or "scholar"

    # La banda de edad gobierna cuántas preguntas caben por nivel
    band = get_band(band_key)
    band_qc = band.get("questions_per_level")
    question_count = getattr(payload, 'question_count', 0) or 0
    if band_qc is not None:
        question_count = band_qc
    if question_count <= 0:
        question_count = level

    # Clasificación de dominio (heurística local, sin costo de IA)
    domain_info = classify_domain(payload.text)
    domain = getattr(payload, 'domain', None) or domain_info["domain"]

    excl_signature = ",".join(sorted(excluded_concepts)) if excluded_concepts else "none"
    cache_signature = (
        f"{payload.text.strip()}_lvl{level}_qc{question_count}_{difficulty}"
        f"_excl_{excl_signature}_band_{band_key}_dom_{domain}_v2"
    )
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

    # =====================================================================
    # DOMINIOS PROCEDURALES (matemática, física) → motores de plantillas:
    # 0 tokens, respuestas exactas, distractors = misconcepciones reales.
    # =====================================================================
    PROCEDURAL_BUILDERS = {
        "matematica": _build_math_board,
        "fisica": _build_physics_board,
    }
    if domain in PROCEDURAL_BUILDERS:
        try:
            board_result = PROCEDURAL_BUILDERS[domain](
                payload, band_key, level, question_count,
                variation_seed=variation_seed,
            )
        except HTTPException:
            raise
        except Exception as me:
            logger.error(f"Motor procedural '{domain}' falló, cayendo a LLM: {me}")
        else:
            board_result = filter_board_for_band(board_result, band_key)
            if db_manager.db is not None:
                try:
                    board_dict = {
                        "id_tablero": board_result.id_tablero,
                        "title": board_result.title,
                        "domain": board_result.domain,
                        "age_band": board_result.age_band,
                        "nodes": [n.model_dump() for n in board_result.nodes],
                        "cards": [c.model_dump() for c in board_result.cards],
                        "created_at": utcnow_iso()
                    }
                    await db_manager.db["game_boards"].insert_one(board_dict)
                    await db_manager.db["cached_analyses"].update_one(
                        {"content_hash": content_hash},
                        {"$set": {
                            "content_hash": content_hash,
                            "title": board_result.title,
                            "board": board_dict,
                            "generator": f"{domain}_engine",
                            "updated_at": utcnow_iso()
                        }},
                        upsert=True
                    )
                    save_to_l1_cache(content_hash, board_result)
                except Exception as dbe:
                    logger.warning(f"Error guardando tablero {domain} en MongoDB: {dbe}")
            else:
                save_to_l1_cache(content_hash, board_result)
            return board_result

    try:
        ai_data = ai_service.extract_concepts_from_text(
            payload.text,
            variation_seed=variation_seed,
            question_count=question_count,
            difficulty=difficulty,
            level=level,
            excluded_concepts=excluded_concepts,
            age_band=band_key,
            gender=getattr(payload, 'gender', None),
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
        board_result = board_result.model_copy(update={
            "domain": domain,
            "age_band": band_key,
            "board_version": 2,
        })
        board_result = filter_board_for_band(board_result, band_key)

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
