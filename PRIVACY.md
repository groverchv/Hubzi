# Mapa de Datos, Retención y Privacidad

Documento de trabajo para DPIA / revisión legal (GDPR + COPPA). Describe qué
guardamos, por qué, cuánto tiempo y quién accede.

## Datos por colección

| Colección | Datos | Sensibilidad | Retención | Base legal |
|---|---|---|---|---|
| `users` | email, hash bcrypt, nombre, edad, `age_band`, género, plan, flags MFA/verificación | Alta (menores) | Vida de la cuenta; purga a los 2 años de inactividad con aviso previo | Contrato + consentimiento |
| `study_folders` | Nombre de carpeta, `extracted_text` de documentos del usuario | Media | Cuenta registrada: vida de la cuenta. Invitados: **TTL 30 días** (`expires_at`) | Contrato |
| `zen_logs` | `notes` **cifrado Fernet**, `log_type`, duración | **Crítica** (salud mental de menores) | Vida de la cuenta; se borra en cascada | Consentimiento explícito |
| `student_progress` | Progreso BKT por isla/tema | Media (datos escolares) | Ciclo escolar; borrado en cascada | Interés legítimo / contrato escuela |
| `skill_mastery` | Probabilidades de dominio por habilidad | Media | Vida de la cuenta; borrado en cascada | Contrato |
| `ai_training_dataset` | Extracto de 1000 chars de docs + salida IA, con `user_id` | Media | Solo con consentimiento; borrado en cascada | Consentimiento |
| `jobs` | Estado de generaciones asíncronas | Baja | **TTL 30 días** | Contrato |
| `sessions` | jti, IP, user-agent, last_seen | Media | TTL 35 días; revocable por el usuario | Seguridad (interés legítimo) |
| `security_events` | Audit trail: actor, tipo, IP, timestamp — **sin secretos ni PII de contenido** | Media | TTL 1 año | Seguridad (interés legítimo) |
| `consumed_tokens` | jti de tokens de un solo uso | Baja | TTL 7 días | Seguridad |
| `stripe_events` | event_id de webhooks procesados | Baja | TTL 30 días | Seguridad |
| `ux_events` | Telemetría de uso (sin query params con tokens) | Baja | TTL 90 días (pendiente índice) | Consentimiento analítica |
| `grades`, `institutions` | Estructura escolar, `student_ids` | Media | Vida del contrato escolar | Contrato con la institución |
| `embedding_cache` | `chunk_hash` → embedding | Baja | Indefinida (no contiene texto ni usuario) | Funcional |

## Menores: minimización hacia terceros

- **LLMs (Gemini/Groq)**: para `age_band` de menor, el perfil que viaja al
  prompt es alias neutro + franja etaria ("Semillita", "Aventurero") —
  **nunca** nombre real ni edad exacta. Documentos: texto del material de
  estudio (necesario para la función) con delimitadores anti-inyección.
- **ElevenLabs**: solo `voice_id` de catálogo, sin datos del usuario.
- **PostHog**: `$current_url`/`$referrer` se envían sin query string
  (tokens y `session_id` de Stripe no salen a analytics). Pendiente:
  revisar `ip_anonymization` y session replay.
- **Stripe**: pago procesado por Stripe (PCI en Stripe, no tocamos PAN);
  solo guardamos `event_id`/`customer` referencias.

## Consentimiento parental

Cuentas con `needs_parental_consent(age_band)` exigen `parental_consent: true`
en el registro y se guarda `consented_at`. **Pendiente legal**: COPPA exige
consentimiento *verificable* — la evolución prevista es email al padre/madre
con confirmación (cuenta en `consent_pending` hasta validar). Requiere
revisión legal antes del lanzamiento público con menores.

## Derechos del titular (implementados)

- **Acceso/portabilidad**: `POST /api/v1/users/me/export` (con contraseña
  reciente + email verificado) — JSON completo.
- **Supresión**: `DELETE /api/v1/users/me` — borrado en cascada de carpetas,
  vectores RAG, zen_logs, progreso, skills, jobs, dataset IA, membresías.
- **Rectificación**: perfil editable.
- **Revocación de sesiones**: `GET/DELETE /api/v1/auth/sessions`.

## Datos que NUNCA se loggean ni exportan en claro

Contraseñas, hashes bcrypt, JWTs completos, secretos TOTP (se guardan
cifrados, nunca en logs), contenido de `zen_logs.notes` (cifrado en reposo;
solo se descifra para el propio usuario en su exportación), datos de tarjeta.

## Encargados de tratamiento (procesadores)

MongoDB Atlas (BD), Qdrant Cloud (vectores), Google Gemini, Groq (LLM),
ElevenLabs (voz), Stripe (pagos), PostHog (analítica), Sentry (errores).
**Pendiente**: DPAs firmados con cada uno antes de datos de menores reales.
