# Plan de Respuesta a Incidentes de Seguridad

Hubzy maneja datos de menores (COPPA/GDPR aplican). Este plan define cómo
reaccionar ante un incidente de seguridad.

## Severidades

| Nivel | Ejemplo | Respuesta |
|---|---|---|
| **S1 Crítico** | Acceso a `zen_logs` de menores, dump de `users`, credenciales Stripe/Gemini expuestas | Activación inmediata, contención <1h, notificación regulatoria evaluada <72h |
| **S2 Alto** | Bypass de autorización (IDOR), sesión de terceros tomada, pago fraudulento | Contención <4h, análisis <24h |
| **S3 Medio** | Prompt-injection efectiva en contenido escolar, abuso de rate-limit | Corrección <72h |
| **S4 Bajo** | Intento detectado y bloqueado (canary, lockout) | Revisión semanal del audit trail |

## Fases

### 1. Detección y triaje (0–1h)
- Fuentes: `security_events` (audit trail), alertas Sentry, reporte de
  usuario (`security@hubzy.app` / `/.well-known/security.txt`), proveedores.
- Clasificar severidad y designar un responsable (IC).
- **No apagar nada todavía** si se necesita evidencia forense.

### 2. Contención
Según el vector:
- **Credencial/sesión comprometida** → el usuario hace `POST /auth/logout`
  (revoca todo) o el equipo sube `token_version` directamente en BD.
- **API key filtrada** (Gemini/Groq/Stripe/ElevenLabs/Mongo) → rotarla
  *primero* en el proveedor, luego actualizar `backend/.env` / Secrets
  Manager y redesplegar. Rotar `JWT_SECRET` si el JWT pudo ser forjado
  (usa `JWT_SECRET_PREVIOUS` para no cerrar sesiones legítimas de golpe).
- **Endpoint vulnerable activo** → hotfix o feature-flag que lo deshabilite.
- **Pago fraudulento** → reembolso/cancelación en Stripe + revocar plan.

### 3. Erradicación y recuperación
- Parchear la causa raíz, no el síntoma. Test de regresión obligatorio.
- Si hubo escritura maliciosa en BD: restaurar desde backup (ver
  `docs/BACKUP_RESTORE.md`) o limpieza quirúrgica con evidencia del alcance.

### 4. Notificación
- **GDPR**: si hay riesgo para derechos y libertades → autoridad de
  protección de datos en **72h** desde el conocimiento.
- **COPPA/menores**: si afecta a alumnos de una institución → notificar al
  contacto de la escuela; ellos coordinan con las familias.
- **Usuarios**: comunicación clara de qué pasó, qué datos, qué hacer.

### 5. Post-mortem (<1 semana)
- Qué pasó, cómo se detectó, qué lo empeoró, qué lo mitigó.
- Acciones: cada gap detectado se convierte en ticket o en mecanismo
  defensivo (nunca solo "documentarlo").
- Actualizar THREAT_MODEL.md si el ataque era un vector no modelado.

## Datos que NO se loggean nunca en un incidente
Contraseñas, JWTs completos, secretos MFA, contenido de `zen_logs.notes`
descifrado, números de tarjeta. El audit trail ya respeta esto.

## Contactos
- Seguridad: security@hubzy.app
- Infraestructura: responsable DevOps del despliegue
- DPO/legal (datos de menores): a designar antes del lanzamiento público
