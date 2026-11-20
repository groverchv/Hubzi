#!/usr/bin/env bash
# Backup diario de MongoDB: mongodump → gzip → GPG → archivo local/S3.
# Requiere: mongodump, gpg (y opcionalmente aws cli si BACKUP_S3_BUCKET está puesto).
#
#   MONGODB_URI=mongodb+srv://... GPG_RECIPIENT=ops@hubzy.app ./scripts/backup_mongodb.sh
#
# Crontab sugerido (diario 03:15):
#   15 3 * * * cd /opt/hubzy && ./scripts/backup_mongodb.sh >> /var/log/hubzy-backup.log 2>&1
set -euo pipefail

: "${MONGODB_URI:?MONGODB_URI requerido (incluye credenciales — ponla en env, no en el script)}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${BACKUP_DIR}/hubzy-${STAMP}"

mkdir -p "${BACKUP_DIR}"

# Dump (excluye colecciones regenerables: cachés y dedup — bajan el costo
# sin perder datos del usuario).
mongodump --uri="${MONGODB_URI}" --gzip --archive="${OUT}.archive" \
  --excludeCollection=embedding_cache \
  --excludeCollection=cached_analyses \
  --excludeCollection=consumed_tokens \
  --excludeCollection=stripe_events

# Cifrado: el dump contiene datos de menores — nunca se almacena en claro.
if [[ -n "${GPG_RECIPIENT:-}" ]]; then
  gpg --batch --yes --trust-model always \
    --encrypt --recipient "${GPG_RECIPIENT}" \
    --output "${OUT}.archive.gpg" "${OUT}.archive"
  rm -f "${OUT}.archive"
  OUT="${OUT}.archive.gpg"
else
  OUT="${OUT}.archive"
  echo "AVISO: GPG_RECIPIENT no definido — backup SIN cifrar (solo dev)." >&2
fi

# Subida a S3 versionado si hay bucket configurado (ciclo de vida del bucket
# gestiona la retención remota; aquí solo local).
if [[ -n "${BACKUP_S3_BUCKET:-}" ]]; then
  aws s3 cp "${OUT}" "s3://${BACKUP_S3_BUCKET}/hubzy-mongo/" --storage-class STANDARD_IA
fi

# Rotación local: borra backups más viejos que RETENTION_DAYS.
find "${BACKUP_DIR}" -name 'hubzy-*.archive*' -mtime "+${RETENTION_DAYS}" -delete

echo "Backup completado: ${OUT}"
