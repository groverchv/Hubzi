# Hubzy

**Arena de aprendizaje zen**: convierte tus apuntes (PDF, Word, imágenes) en un juego de memoria de 20 niveles con **Capi**, una capibara compañera que cuida tu calma antes de los exámenes con técnicas de regulación emocional basadas en evidencia (TCC, respiración 4-7-8, grounding 5-4-3-2-1).

Pensado para estudiantes universitarios (target inicial: UAGRM, Bolivia). Ver `docs/exploracion-ansiedad-uagrm.md` para la investigación de base.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + Tailwind 4 + Framer Motion + React Router + Zustand + i18next |
| Backend | FastAPI + Motor (MongoDB async) + Qdrant (RAG) |
| IA | Google Gemini (extracción, voz, embeddings) + Groq (NLP clínico rápido) |
| Pagos | Stripe Checkout (suscripción Pro) + webhook firmado |
| Infra | Docker Compose · GitHub Actions CI · PWA |

## Inicio rápido

```bash
# 1. Backend
cd backend
python -m venv venv && ./venv/Scripts/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # completa GEMINI_API_KEY, JWT_SECRET, etc.
uvicorn app.main:app --reload --port 8000

# 2. Frontend (otra terminal)
cd frontend
npm install
cp .env.example .env
npm run dev            # http://localhost:5173

# 3. Todo junto con Docker (MongoDB + Qdrant incluidos)
docker compose up --build
```

## Tests

```bash
cd backend && python -m pytest tests/ -q     # 11 tests: auth JWT, IDOR, crisis
cd frontend && npm test                     # Vitest: componentes y store
```

## Arquitectura

```
backend/app/
├── core/           # config, security (JWT/bcrypt), database, plans (freemium),
│                   # rate_limit (slowapi), session_store (dev sin BD)
├── routers/        # auth · users · arena · folders · zen · voice
│                   # psychology · payments · ai · ws (dominio por archivo)
├── services/       # ai_service (Gemini/Groq) · psychology_service (NLP clínico)
│                   # voice_service (edge-tts/ElevenLabs) · board_service (tableros+caché)
│                   # rag_service (embeddings Qdrant, "pregúntale a tus apuntes")
├── schemas/        # Pydantic: tablero, nodos, cartas
├── models/         # Pydantic: usuarios, auth
├── websockets/     # manager de salas 1v1
└── tests/          # pytest

frontend/src/
├── pages/          # LandingPage · DashboardPage · ZenPage · ArcadeArena (juego)
├── components/     # modales del juego + CrisisModal (protocolo de ayuda)
├── lib/            # api.js (fetchWithAuth+JWT) · crisis.jsx · observability (Sentry/PostHog)
├── store/          # authStore (Zustand persistente)
├── locales/        # es.json · en.json (i18n)
└── hooks/, utils/  # audio, voz de Capi, catálogo de mascotas (WebP)
```

## Seguridad implementada

- JWT (PyJWT) con `Authorization: Bearer` en todos los endpoints protegidos
- Contraseñas bcrypt con migración transparente desde el formato legado
- Autorización: `user_id` siempre sale del token (anti-IDOR); invitados con scope limitado
- Rate limiting (slowapi) en auth, generación IA, uploads y voz
- CORS restringido por `CORS_ORIGINS` (nunca `*` con credenciales)
- Stripe: checkout autenticado + webhook con verificación de firma
- Magic bytes + límite 25 MB en uploads; texto extraído sanitizado

## Endpoints clave

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/auth/register` `/login` | Cuenta + JWT |
| GET | `/api/v1/auth/me` | Perfil desde token |
| POST | `/api/v1/arena/generate` | Texto → tablero (caché L1/L2) |
| POST | `/api/v1/folders/{id}/upload-document` | Sube doc + indexa en Qdrant |
| POST | `/api/v1/folders/{id}/generate-game` | Tablero por nivel desde la carpeta |
| POST | `/api/v1/folders/{id}/ask` | RAG: "pregúntale a tus apuntes" |
| POST | `/api/v1/psychology/analyze` | NLP clínico TCC + flag `is_crisis` |
| GET | `/api/v1/psychology/crisis-resources` | Recursos de derivación (configurables) |
| GET | `/api/v1/psychology/protocols` | Protocolos zen basados en evidencia |
| POST | `/api/v1/payments/create-checkout-session` | Suscripción Pro (requiere JWT) |
| POST | `/api/v1/payments/webhook` | Eventos Stripe firmados |
| WS | `/ws/arena/{room}/{client}` | Batallas 1v1 en vivo |

## Modelo freemium

| | Free | Pro ($2.99/mes) |
|---|---|---|
| Carpetas | 3 | Ilimitadas |
| Docs/carpeta | 5 | Ilimitados |
| Preguntas/juego | 8 | 30 |
| Batallas 1v1 | — | ✓ |

## Protocolo de crisis

El NLP clínico puede devolver `is_crisis=true` en `/capy-ask` y `/psychology/analyze`. El frontend lo muestra con `CrisisModal` y recursos de `/psychology/crisis-resources` (configurables por `CRISIS_RESOURCES_JSON`).

> **Importante ético** (del doc de exploración): Hubzy no diagnostica ni sustituye atención profesional. Verificar los números de ayuda locales y el contacto de Bienestar UAGRM antes de producción.

## Variables de entorno

Backend: ver `backend/.env.example` (Mongo, Qdrant, Gemini, Groq, Stripe, `JWT_SECRET`, `CORS_ORIGINS`, `SENTRY_DSN`).
Frontend: ver `frontend/.env.example` (`VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY`).

## Equipo

**SynapseHub** — Hackathon project convertido en startup MVP.
