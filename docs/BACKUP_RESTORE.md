# Backup y Restauración

## Objetivos

- **RPO ≤ 24h**: backup diario automatizado (`scripts/backup_mongodb.sh`).
- **RTO ≤ 4h**: restore probado mensualmente (drill obligatorio — un backup
  no testeado no es un backup, es una esperanza).

## Qué se respalda

MongoDB completo **excepto** colecciones regenerables (`embedding_cache`,
`cached_analyses`, `consumed_tokens`, `stripe_events`). Qdrant NO se
respalda: los vectores se re-indexan desde `extracted_text` tras el restore
(ver "Re-indexación RAG").

## Estrategia por entorno

| Entorno | Método |
|---|---|
| Atlas (recomendado) | **Atlas Continuous/Cloud Backup** — activarlo en el cluster, retention ≥7d, point-in-time si el tier lo permite |
| Self-hosted (compose `local-db`) | Cron en el host: `scripts/backup_mongodb.sh` → `.archive.gpg` → S3 versionado |

El dump se **cifra con GPG** antes de salir de la máquina — contiene datos
de menores. La passphrase/clave GPG vive fuera del servidor (gestor de
secretos del equipo, jamás en el repo).

## Restore (drill mensual)

```bash
# 1. Descargar y descifrar
aws s3 cp s3://$BACKUP_S3_BUCKET/hubzy-mongo/hubzy-FECHA.archive.gpg .
gpg --decrypt hubzy-FECHA.archive.gpg > hubzy-FECHA.archive

# 2. Restaurar en un entorno AISLADO primero (nunca directo a prod en drill)
mongorestore --uri="$MONGODB_URI_TEST" --gzip --archive=hubzy-FECHA.archive \
  --nsFrom 'hubzy_db.*' --nsTo 'hubzy_restore_test.*'

# 3. Verificar: conteos de users/study_folders/zen_logs ≈ producción;
#    login de una cuenta de prueba; export de datos de prueba completo.
```

## Re-indexación RAG tras restore

Los vectores de Qdrant no se respaldan. Tras restaurar `study_folders`:

1. Para cada documento de carpeta con `extracted_text`, llamar
   `rag_service.index_document(folder_id, doc_id, name, text, user_id)`
   (script de re-indexación one-shot o regeneración lazy al primer uso).

## Checklist del drill mensual

- [ ] Backup de ayer existe y tamaño razonable
- [ ] Descifrado GPG funciona (clave accesible)
- [ ] `mongorestore` en entorno test OK
- [ ] Conteos de documentos ≈ producción
- [ ] Usuario de prueba puede loguear y exportar sus datos
- [ ] Tiempo total del drill registrado (objetivo: <4h)
