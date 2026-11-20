# Política de seguridad — Hubzi

## Reportar una vulnerabilidad

Si encuentras una vulnerabilidad de seguridad en Hubzi, **no abras un issue público**.

Envía los detalles a: **security@hubzi.app** (o abre un aviso privado vía
GitHub Security Advisories en este repositorio).

Incluye:

- Descripción del problema y su impacto potencial.
- Pasos para reproducirlo (PoC si es posible).
- Versiones/commit afectados.

## Compromiso de respuesta

- **Acuse de recibo:** en 72 horas laborables.
- **Evaluación y triage:** en 7 días.
- **Fix:** según severidad — críticas lo antes posible, el resto en el
  siguiente ciclo de release.

Divulgación coordinada: agradecemos no publicar el hallazgo hasta que el
parche esté disponible.

## Alcance

Hubzi procesa datos de menores, documentos subidos por usuarios, contenido
generado por LLMs, datos institucionales y pagos (Stripe). Son especialmente
relevantes los reportes sobre:

- Control de acceso / IDOR entre usuarios o invitados.
- Inyección (prompts, Mongo, headers, plantillas).
- Exposición de datos de menores a terceros.
- Bypass de autenticación o de límites de abuso (rate limits, planes).
- Procesamiento inseguro de archivos subidos.
