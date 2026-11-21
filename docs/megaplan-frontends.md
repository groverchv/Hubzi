# Megaplan — Hubzy Admin + Hubzy Escuelas

> **ESTADO** (2026-11-21): Backend (B0+B1+B2) y **AMBOS FRONTENDS IMPLEMENTADOS** ✅
> - `frontend-school/` (puerto 5174) y `frontend-admin/` (puerto 5175) creados,
>   compilando y corriendo contra el backend local.
> - Endpoint extra añadido para la UI: `GET /institutions/grades/{id}/folders`
>   (materias del grado en proyección ligera).
>
> Backend previo:
> - `role`/`institution_id`/`grade_ids` en `UserProfileResponse`; rol `superadmin`
>   (`SUPERADMIN_EMAILS` bootstrap + rol persistido); gate `account_disabled`.
> - Router `/api/v1/admin` completo: overview, system, institutions CRUD+admins,
>   users (search/patch/delete GDPR), subscriptions, security-events, jobs, superadmins.
> - Gestión institucional: PATCH/DELETE institución+grados, rotación de códigos,
>   docentes (listar/quitar/asignar), estudiantes (listar/matrícula individual/
>   reset password/mover/desmatricular), overview KPIs, gate de suspensión.
> - Materias escolares co-gestionables por cualquier docente/admin del grado.
> - Tests: 23 nuevos (158/159 suite verde; 1 fallo externo por cuota de API LLM).
> - Decisiones: carpetas `frontend-school/` + `frontend-admin/`; cliente API
>   duplicado al inicio; puertos 5174/5175.

> Objetivo: dos frontends React nuevos sobre el MISMO backend FastAPI.
> 1. **Hubzy Escuelas** (`school-frontend/`) — directores/admins y docentes de instituciones.
> 2. **Hubzy Admin** (`admin-frontend/`) — superadmin de la plataforma (nosotros/SynapseHub).
> El frontend actual (`frontend/`) queda como la app del juego/estudiante.

---

## 0. Estado actual (lo que ya existe)

### Backend — endpoints institucionales YA implementados
| Endpoint | Quién | Para qué |
|---|---|---|
| `POST /institutions` | cualquier cuenta | Crear institución (creador → `admin` + MFA obligatorio) |
| `POST /institutions/join` | cuenta | Unirse con código `HUBZY-` (grado→student) o `PROF-` (→teacher) |
| `GET /institutions/mine` | miembro | Mi institución + grados + rol |
| `POST /institutions/{id}/checkout` | admin inst. | Licencia por seats vía Stripe |
| `POST /institutions/{id}/grades` | admin/teacher | Crear grado/paralelo (genera `join_code`) |
| `POST /institutions/grades/{id}/folders` | teacher | Crear MATERIA dentro del grado |
| `POST /institutions/grades/{id}/assign` | teacher | Asignar materia/isla con fecha (badge 📌) |
| `GET /institutions/grades/{id}/dashboard` | teacher/admin | Panel: progreso estudiante × materia × isla + temas débiles |
| `POST /institutions/grades/{id}/students/bulk` | teacher | Matrícula masiva CSV (crea cuentas, devuelve credenciales) |
| `GET /institutions/grades/{id}/students/{uid}/report` | teacher/admin | Reporte individual imprimible |
| `GET /ai/training-dataset/*` | `ADMIN_EMAILS` | Stats + export del dataset IA |

### Modelo de datos y permisos
- `institutions`: `{id, name, admin_ids[], teacher_ids[], teacher_code, plan, subscription{status,seats,...}}`
- `grades`: `{id, institution_id, name, join_code, teacher_ids[], folder_ids[], student_ids[]}`
- Materia = `study_folders` con `grade_id + institution_id + is_school_folder`
- Roles en `users`: `individual | student | teacher | admin` (admin = director de institución)
- Permiso por membresía explícita (`admin_ids`/`teacher_ids`), NO por rol global — anti cross-tenant.
- Auth: JWT en cookie HttpOnly + `X-Requested-With` (CSRF). MFA enforced para teacher/admin (`mfa_required`).

### Frontend actual (a replicar como base)
React 19 · Vite 8 · Tailwind 4 · Zustand 5 (persist) · React Router 7 · i18next · lucide-react · Framer Motion.
`src/lib/api.js` (apiFetch + uploadWithProgress + ensureGuestSession), `src/store/authStore.js`, proxy `/api` en vite.config.

### GAPS de backend (lo que falta para estos frontends)
- ❌ Rol `superadmin` — solo existe `ADMIN_EMAILS` para el dataset de IA.
- ❌ Router `/admin`: no hay listado global de instituciones/usuarios/suscripciones/métricas.
- ❌ `UserProfileResponse` no expone `role` ni `institution_id` → los frontends no pueden hacer gating por rol.
- ❌ Gestión institucional: no hay PATCH/DELETE de grados, ni quitar estudiantes/docentes, ni reset de contraseña de alumno, ni lista de docentes, ni PATCH/DELETE de institución, ni regenerar códigos.
- ⚠️ Verificar: en `folders.py` el permiso sobre materias probablemente es por `user_id` dueño → otros docentes del grado no podrían gestionar materias ajenas. Revisar `_can_access_folder` y extender a "teacher del grado" para carpetas `is_school_folder`.
- ⚠️ `FRONTEND_URL` único: los redirects de Stripe/emails asumen UNA app. Con 3 frontends hay que validar `success_url`/`cancel_url` contra una lista blanca de orígenes por app (o parámetro `app=school|admin|game`).

---

## 1. Arquitectura

```
Proyecto/
├── frontend/           # App juego (estudiantes) — existe. :5173
├── school-frontend/    # NUEVO: directores + docentes.        :5174
├── admin-frontend/     # NUEVO: superadmin plataforma.        :5175
├── packages/shared/    # (Fase 4) @hubzy/shared: api.js, authStore, UI kit, i18n
└── backend/            # MISMO FastAPI — se amplía con /admin + endpoints de gestión
```

- **3 apps Vite separadas**, mismo stack. Cada una con su `vite.config.js` (puerto + proxy `/api` → `localhost:8000`).
- **Compartir código**: Fase 1 duplicar `api.js`/`authStore.js` (son ~200 líneas); Fase 4 extraer `packages/shared` con npm workspaces si vale la pena.
- **Identidad visual distinta por app** (misma base Tailwind):
  - Juego: tema arcade/capybara actual.
  - Escuelas: tema "dashboard" limpio, sobrio, confiable (densidad de tabla).
  - Admin: tema dark técnico, denso, orientado a datos.

### Dominios producción (sugerido)
| App | Dev | Prod |
|---|---|---|
| Juego | `:5173` | `app.hubzy.lat` (o dominio actual) |
| Escuelas | `:5174` | `escuelas.hubzy.lat` |
| Admin | `:5175` | `admin.hubzy.lat` (idealmente + allowlist IP/VPN) |

Subdominios > paths: cookies same-origin por subdominio, CSP por app, despliegues independientes. Caddy multi-site trivial.

`CORS_ORIGINS` pasa a incluir los 3 orígenes (dev + prod).

---

## 2. Cambios de backend

### Fase B0 — base (pequeño, primero)
1. `UserProfileResponse` += `role`, `institution_id`, `grade_ids` → gating en frontends.
2. `config.py`: `SUPERADMIN_EMAILS` (bootstrap) o campo `is_superadmin` en users. Recomendado: `role: "superadmin"` en el doc + env para elevar la primera cuenta.
3. `security.py`: dependencia `require_superadmin` (401/403). MFA obligatorio para superadmin también.
4. Revisar permiso de materias escolares en `folders.py`: cualquier teacher del grado puede gestionar (no solo el `user_id` creador).
5. Stripe: whitelist de orígenes de retorno por app (`ALLOWED_CHECKOUT_ORIGINS`).

### Fase B1 — router `admin.py` (superadmin) `/api/v1/admin`
| Endpoint | Función |
|---|---|
| `GET /admin/overview` | KPIs: usuarios totales/activos, instituciones, suscripciones activas (Pro+school), docs, carpetas, games generados, jobs fallidos |
| `GET /admin/institutions` | Lista paginada + búsqueda + filtro (activa/suspendida/sin licencia) |
| `GET /admin/institutions/{id}` | Detalle: grados, miembros, seats usados/limp., docs subidos, actividad |
| `POST /admin/institutions` | Crear institución asignando `admin_ids` a un email dado (onboarding asistido) |
| `PATCH /admin/institutions/{id}` | Renombrar, ajustar `seats` manual, `subscription.status` (activate/suspend/comp) |
| `DELETE /admin/institutions/{id}` | Borrado en cascada: grades→folders→progress→membership users |
| `POST /admin/institutions/{id}/admins` | Añadir/quitar `admin_ids` |
| `GET /admin/users` | Búsqueda email/username + filtros (plan, role, institution, fecha) + paginación |
| `GET /admin/users/{id}` | Perfil + carpetas + actividad + sesiones |
| `PATCH /admin/users/{id}` | Cambiar plan, `disabled` (ban), role, reset `token_version` (kick sesiones) |
| `DELETE /admin/users/{id}` | Borrado GDPR administrado (reusa `account_lifecycle`) |
| `GET /admin/subscriptions` | Pro + school: estado, seats, stripe_customer |
| `GET /admin/security-events` | Auditoría (colección `security_events` ya existe) |
| `GET /admin/jobs` | Jobs async recientes + fallos |
| `GET /admin/system` | Mongo/Qdrant status, flags (procedural, prewarm), versión |
| `GET /admin/superadmins` + `POST/DELETE` | Gestionar quién es superadmin |

Todo `admin.py`: guard `require_superadmin`, rate limit moderado, y **cada acción mutadora escribe `security_events`** (actor, acción, target, diff).

Suspensión: `users.disabled=True` → `get_current_user` responde 403. Institución suspendida → gate en login/join de sus miembros (o banner read-only).

### Fase B2 — gestión institucional (`institutions.py`)
| Endpoint nuevo | Función |
|---|---|
| `PATCH /institutions/{id}` | Renombrar institución (admin) |
| `POST /institutions/{id}/regenerate-teacher-code` | Rotar `PROF-` (invalida el viejo) |
| `DELETE /institutions/{id}` | Solo admin + confirmación (o solo superadmin) |
| `GET /institutions/{id}/teachers` | Lista docentes (username/email/grados asignados) |
| `DELETE /institutions/{id}/teachers/{uid}` | Quitar docente (de institución y sus grados) |
| `PATCH /grades/{id}` | Renombrar grado |
| `POST /grades/{id}/regenerate-code` | Rotar `join_code` |
| `DELETE /grades/{id}` | Borrar grado (opción: desmatricular alumnos, conservar/borrar materias) |
| `GET /grades/{id}/students` | Lista simple de alumnos (hoy solo va dentro del dashboard) |
| `DELETE /grades/{id}/students/{uid}` | Desmatricular alumno del grado |
| `POST /grades/{id}/students/{uid}/reset-password` | Nueva temporal + `must_change_password` |
| `POST /grades/{id}/students` | Matrícula individual (bulk ya existe) |
| `POST /grades/{id}/students/{uid}/move` | Mover alumno a otro grado de la misma institución |
| `PATCH /grades/{id}/teachers` | Asignar/quitar docentes del grado |
| `GET /institutions/{id}/overview` | KPIs institución para su dashboard (alumnos activos, materias, seats) |
| `GET /institutions/{id}/export` | Export CSV progreso agregado (opcional, Fase tardía) |

### Fase B3 — extras de producto (evaluar, no bloqueantes)
- Anuncios del grado (`announcements[]` en grade: texto + fecha — el frontend juego los muestra).
- Config por materia: nº preguntas/nivel, dificultad, prewarm on/off.
- Periodos/gestión lectiva (`academic_year`) para archivar grados al cerrar el año.
- Certificado/insignia por isla completada.

---

## 3. `school-frontend/` — Hubzy Escuelas

**Usuarios**: `admin` (director/coordinador) y `teacher`. Mismo JWT cookie; gating por `role` + `_can_teach`/`_can_manage` en backend.

### Páginas / rutas
```
/login                  Email+password (+ captcha tras fallos, + paso MFA)
/mfa/setup              Enrolamiento TOTP obligatorio (primer ingreso)
/  → redirect por rol:  admin → /panel · teacher → /grados

/panel                  (admin) KPIs: alumnos matriculados, seats usados/limite,
                        grados, materias, docentes, actividad reciente,
                        alertas (licencia por vencer, seats al 90%)

/grados                 Lista de grados con join_code, nº alumnos/materias.
                        [+ Crear grado] modal.

/grados/:id             Tabs:
  ├─ Estudiantes        Tabla (nombre, últ. actividad, progreso %, acciones).
  │                     [Matricular CSV] pegar tabla o subir .csv → preview →
  │                     confirmar → descargar credenciales (CSV/print).
  │                     [Matricular individual] · reset password · desmatricular · mover.
  ├─ Materias           Cards/tabla de materias del grado.
  │                     [+ Nueva materia] → dentro: subir documentos
  │                     (PDF/Word/imagen), estado de indexación, detectar temas
  │                     → islas resultantes, regenerar, archivar/eliminar.
  ├─ Docentes           Docentes asignados al grado. (admin) asignar/quitar.
  ├─ Progreso           Dashboard existente: tabla alumno × materia × isla
  │                     (nivel, estrellas, XP, completado, últ. jugada) +
  │                     panel "Temas débiles del curso" ordenado.
  │                     → click alumno: reporte individual (imprimible/PDF).
  └─ Asignaciones       Crear: materia/isla + título + fecha objetivo.
                        Lista de asignaciones activas.

/docentes               (admin) Todos los docentes de la institución.
                        Invitar: muestra código PROF-XXXXX + link de unión
                        + instrucciones para compartir. Quitar docente.

/licencia               (admin) Estado: plan, seats usados/contratados, renovación.
                        Slider de seats → Stripe Checkout → retorno.
                        Historial de pagos (si lo expone Stripe/endpoint).

/institucion/ajustes    (admin) Nombre, código de docente (regenerar),
                        co-admins (añadir email → admin_ids), zona peligrosa
                        (archivar/eliminar institución).

/reporte/:grade/:student  Vista imprimible (existe endpoint) — CSS @media print.
```

### Componentes clave
- `DataTable` reutilizable (sort, filtro, paginación client-side).
- `CsvImportWizard`: textarea/file → parse → preview → confirm → resultado con credenciales copiables/descargables.
- `JoinCodeChip`: código con botón copiar + tooltip de expiración.
- `SeatMeter`: barra seats usados/disponibles.
- `PrintReport`: layout A4 del reporte individual.
- `RoleGate`: wrapper de ruta por rol (admin-only vs teacher).
- i18n es/en copiando `locales/` y recortando claves.

### Diseño
Denso y sobrio (tablas, filtros) pero con el lenguaje visual Hubzy (islas/materias como entidades con nombre propio, badges de progreso, Hubzi como avatar discreto en empty states).

---

## 4. `admin-frontend/` — Hubzy Admin (superadmin)

**Usuario**: solo `role: superadmin`. Login separado; MFA obligatorio; idealmente allowlist de IPs en producción.

### Páginas / rutas
```
/login
/panel                  KPIs globales: usuarios (total/activos 7d/30d),
                        instituciones (activas/trial/suspendidas), MRR estimado,
                        suscripciones Pro vs School, docs procesados, games
                        generados, jobs fallidos, costo IA (Respan si está).
                        Gráficos: altas/día, uso por endpoint.

/instituciones          Tabla: nombre, admin, grados, alumnos, seats, estado
                        licencia, creada. Filtros + búsqueda.
/instituciones/:id      Detalle: datos, grados (expandible → materias/alumnos),
                        admins/docentes, licencia (ajustar seats manual,
                        suspender/reactivar, comp seats), actividad.
                        Acciones: añadir admin, suspender, eliminar (2 conf.).

/usuarios               Búsqueda email/username; filtros plan/role/institución.
/usuarios/:id           Perfil, carpetas, progreso, sesiones activas (revocar),
                        cambiar plan (gift Pro), suspender/ban, eliminar GDPR.

/suscripciones          Todas: tipo (Pro/School), seats, estado Stripe, renovación.
                        Acciones: comp, extender trial (manual), ver en Stripe.

/contenido/dataset      Stats + export (endpoint /ai/training-dataset existe —
                        migrar guard a superadmin).

/seguridad              security_events: feed audit (actor, tipo, IP, fecha).
                        Filtros por tipo (login_fail, lockout, admin_action…).

/sistema                /health extendido: Mongo, Qdrant, Stripe reachable,
                        flags activos, versión, jobs recientes.

/superadmins            Lista + añadir/quitar superadmin (auditado).

/ajustes                Config operativa: recursos de crisis JSON,
                        feature flags (si se persisten en colección config).
```

### Reglas propias del admin
- Toda acción destructiva: modal con "escribe el nombre para confirmar".
- Read-only por defecto en vistas de menores: mismo principio (métricas sí, contenido emocional jamás).
- Audit log inmutable de todo lo que hace el superadmin.

---

## 5. Matriz endpoint → pantalla (resumen)

| Pantalla | Endpoints usados |
|---|---|
| Escuelas /panel | `institutions/mine`, `institutions/{id}/overview` (nuevo), grades list |
| Escuelas /grados | `POST /institutions/{id}/grades`, `PATCH/DELETE /grades/{id}` (nuevos) |
| Estudiantes | `students/bulk`, `GET students` (nuevo), `reset-password`, `DELETE student`, `move` (nuevos) |
| Materias | `grades/{id}/folders`, `folders/{id}/upload-document`, `detect-topics`, `PATCH/DELETE /folders/{id}` |
| Progreso | `grades/{id}/dashboard`, `students/{uid}/report` |
| Asignaciones | `grades/{id}/assign` |
| Licencia | `institutions/{id}/checkout`, `payments/verify-session` |
| Admin /instituciones | `GET/PATCH/DELETE /admin/institutions*` (nuevos) |
| Admin /usuarios | `GET/PATCH/DELETE /admin/users*` (nuevos) |
| Admin /suscripciones | `GET /admin/subscriptions` (nuevo) |
| Admin /seguridad | `GET /admin/security-events` (nuevo) |

---

## 6. Fases de ejecución (orden sugerido)

| Fase | Contenido | Criterio de salida |
|---|---|---|
| **0** | Scaffolding `school-frontend` + `admin-frontend` (copiar base, podar páginas del juego, puertos, `.env.local`, CORS dev) | Ambos levantan con login contra el backend |
| **1** | Backend B0 + B2: role/institution_id en perfil, superadmin, endpoints de gestión institución (grados/estudiantes/docentes), permiso materias compartidas | pytest verde + endpoints nuevos testeados |
| **2** | `school-frontend` MVP: login+MFA, /panel, grados CRUD, materias+docs, estudiantes CSV, progreso, reporte, asignaciones, licencia | Un director gestiona su colegio end-to-end |
| **3** | Backend B1: router `/admin` completo | pytest verde |
| **4** | `admin-frontend` MVP: login, /panel, instituciones, usuarios, suscripciones, seguridad | Superadmin opera la plataforma |
| **5** | Extraer `packages/shared`, i18n completo, tests E2E, hardening | Sin duplicación crítica |
| **6** | Deploy: Dockerfile/nginx por app, compose prod, Caddy subdominios, CORS/FRONTEND_URL por app, CI build de 3 frontends | Prod multi-app |

---

## 7. Seguridad y privacidad (checklist)

- [ ] `role`/`institution_id` en `UserProfileResponse` — el gating del frontend es UX; el backend ya valida por membresía.
- [ ] Superadmin: cuenta dedicada, `mfa_required`, audit de cada mutación, sin impersonation en v1 (o con audit duro si se agrega).
- [ ] Cookie JWT: en prod con subdominios → `Domain=.hubzy.lat` o same-site proxy por app. CORS por orígenes exactos, jamás `*`.
- [ ] Docentes/admins nunca ven chats zen ni notas emocionales (ya en diseño — mantener en nuevos endpoints: proyección de campos).
- [ ] `must_change_password` flow también aplica a cuentas creadas por CSV.
- [ ] Endpoints admin: proyección estricta (no devolver password_hash, tokens, secretos MFA).
- [ ] Rate limit en endpoints nuevos (patrón `limiter.limit` existente).
- [ ] `security_events` para altas/bajas/cambios de licencia, suspensions, borrados.

## 8. Riesgos / decisiones abiertas

1. **¿Shared package desde el inicio o duplicar?** Duplicar api.js/authStore es más rápido; extraer en Fase 5.
2. **¿Qdrant/RAG para docentes?** "Pregúntale a tus apuntes" por materia podría ser feature premium docente — decidir.
3. **¿Un director = una institución?** Hoy `users.institution_id` es único → un admin no puede tener 2 colegios. Si hace falta multi-inst, modelo a lista.
4. **Asignación docente↔materia**: hoy el docente dueño de la materia es quien la creó. ¿Hace falta "materia compartida" entre docentes del grado? (gap de permisos en folders.py)
5. **Multi-tenant real en prod**: considerar `tenant_id` en queries si se escala — hoy la membresía ya lo cubre.
6. **Emails a docentes**: invitar docente hoy es solo código PROF-. ¿Email de invitación real cuando haya SMTP?
