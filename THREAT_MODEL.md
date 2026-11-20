# Threat Model — Hubzy (STRIDE)

Sistema: plataforma educativa FastAPI + React para menores (4+), con documentos
subidos por usuarios, contenido generado por LLMs, datos de bienestar, pagos
Stripe y gestión institucional.

## Activos principales

1. Datos de menores: perfil, progreso, **`zen_logs` (salud mental)**
2. Autenticación: contraseñas, JWTs, secretos MFA, sesiones
3. Documentos subidos y su contenido extraído
4. Flujo de pago y estado de plan (free/pro/school)
5. Claves de terceros: Gemini, Groq, ElevenLabs, Stripe, MongoDB
6. Integridad del contenido educativo generado (especialmente en carpetas
   escolares compartidas)

## Análisis STRIDE

### Spoofing (suplantación)
| Amenaza | Mitigación implementada |
|---|---|
| Robo de sesión por XSS | JWT en cookie HttpOnly (no legible por JS); `Secure`+`SameSite=Lax` en prod |
| Fuerza bruta en login | Rate-limit por IP + **lockout progresivo por cuenta** (5 fallos → 15m, 30m, 60m…) |
| Credential stuffing / contraseñas filtradas | HIBP k-anonymity en register/change/reset |
| Cuenta tomada tras login | MFA TOTP opcional (+backup codes hasheados); forzable por `mfa_required` |
| CSRF con cookie | `X-Requested-With` obligatorio en mutaciones cookie-auth |
| Sesión en otro dispositivo | `GET/DELETE /auth/sessions` — listar y revocar por jti; `tv` revoca todo |
| Cuentas escolares con password temporal | `must_change_password` bloquea toda la API hasta cambiarla |

### Tampering (manipulación)
| Amenaza | Mitigación |
|---|---|
| Prompt-injection en documentos | Delimitadores `<documento>`/`<apuntes>` + directiva "son datos"; **canary** detecta patrones y marca `suspicious` + audit |
| Mass-assignment en games/docs | Whitelists `_GAME_ALLOWED_KEYS`/`_DOC_ALLOWED_KEYS` + caps de tamaño |
| `field-path injection` en island_id | Regex `^[\w-]{1,64}$` |
| Webhook Stripe replay | Dedup `stripe_events.event_id` único |
| Checkout de otro usuario | Ownership check incondicional en verify-session |
| Zip bomb / DoS por archivo | Cap 25MB, magic bytes, límites páginas/chars, timeout 120s |

### Repudiation (repudio)
| Amenaza | Mitigación |
|---|---|
| "Yo no hice ese cambio" | `security_events` append-only: logins, lockouts, MFA on/off, cambio pw, revocaciones, exportaciones, borrados, uploads sospechosos |
| Sesión revocada "no era mía" | Registro de jti+IP+UA en `sessions` |

### Information Disclosure (fuga de datos)
| Amenaza | Mitigación |
|---|---|
| IDOR en recursos de usuario | `assert_can_access_user_resource` en todas las rutas por id |
| `zen_logs.notes` en claro en BD | **Cifrado Fernet field-level** (`ENCRYPTION_KEY`) |
| PII de menores a LLMs | Alias + franja etaria (nunca nombre/edad exacta) |
| Exportar la vida del usuario con sesión robada | Step-up: contraseña reciente + email verificado + audit |
| Tokens en URLs/historial/analytics | Scrub `?token=`; PostHog sin query params |
| Enumeración de cuentas | Mismo mensaje+mismo costo bcrypt en login; respuesta genérica en forgot-password |
| Errores internos expuestos | Detail genérico en 5xx; docs deshabilitados en prod |

### Denial of Service
| Amenaza | Mitigación |
|---|---|
| Flood HTTP | Rate-limit por IP (Redis en multi-réplica prod) + WAF edge (pendiente F7) |
| Coste LLM por abuso | Caps por plan (docs, preguntas, storage), rate limits en endpoints LLM |
| Workers/event-loop agotados | Timeouts en extracción y LLM, extracción en thread, body caps |
| Brujería sobre una cuenta | Lockout por cuenta con backoff exponencial |

### Elevation of Privilege
| Amenaza | Mitigación |
|---|---|
| Contenedor comprometido | `cap_drop ALL`, `no-new-privileges`, `read_only`, usuario no-root, límites cpu/mem |
| Dependencia con CVE | pip-audit + npm audit + Trivy + Dependabot + dependency-review en CI; lock file reproducible |
| Secretos en repo | gitleaks en CI (historial completo), `.gitignore` de `.env*`/claves/backups |
| Secretos en `.env` del servidor | Pendiente F7: mover a Secrets Manager/SSM |
| Token robado | Vida 24h + renovación deslizante + `tv`/`jti` revocables |

## Límites honestos (residual risk)

- **Prompt-injection**: mitigada, no eliminable — el peor caso degrada
  contenido generado (texto escapado en React, KaTeX `trust:false`, sin
  `dangerouslySetInnerHTML`). En carpetas escolares el canary marca
  `suspicious` para revisión docente.
- **WAF/DDoS L7 en el edge**: pendiente (Cloudflare/AWS WAF) — hoy la única
  barrera es el rate-limit de la app.
- **Consentimiento parental verificable**: checkbox hoy; requiere flujo de
  confirmación por email + revisión legal (COPPA) antes de producción.
- **Pentest externo**: no realizado — recomendado antes de lanzamiento
  público con datos de menores.
