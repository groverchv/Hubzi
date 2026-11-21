"""
Tests del panel de superadministración (/api/v1/admin).

El rol superadmin llega por SUPERADMIN_EMAILS (bootstrap env) o por
users.role="superadmin". Toda mutación queda auditada.
"""

import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


@pytest.fixture
def client():
    with TestClient(app, headers={"X-Requested-With": "XMLHttpRequest"}) as c:
        yield c


@pytest.fixture(autouse=True)
def _hermetic_ai(monkeypatch):
    import app.routers.arena as arena_router
    import app.routers.folders as folders_router
    from app.services.rag_service import rag_service

    async def _noop(*_a, **_k):
        return None

    monkeypatch.setattr(arena_router, "summarize_and_store", _noop)
    monkeypatch.setattr(folders_router, "summarize_and_store", _noop)
    monkeypatch.setattr(folders_router, "_prewarm_level1", _noop)
    monkeypatch.setattr(folders_router, "detect_topics_and_store", _noop)
    monkeypatch.setattr(rag_service, "index_document", _noop)


def _register(client, tag="adm"):
    email = f"pytest_{tag}_{uuid.uuid4().hex[:8]}@hubzy.dev"
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "secreto123",
            "username": f"U{tag}",
            "gender": "femenino",
            "age": 30,
        },
    )
    assert res.status_code == 200
    data = res.json()
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]


def _make_superadmin(client, monkeypatch, tag="root"):
    """Registra una cuenta y la eleva vía SUPERADMIN_EMAILS."""
    h, user = _register(client, tag)
    monkeypatch.setattr(
        settings, "SUPERADMIN_EMAILS", (user["email"] or "").lower()
    )
    return h, user


def _school(client, h):
    res = client.post("/api/v1/institutions", json={"name": "Colegio Admin"}, headers=h)
    assert res.status_code == 201, res.text
    inst = res.json()["institution"]
    res = client.post(
        f"/api/v1/institutions/{inst['id']}/grades",
        json={"name": "1ro A"},
        headers=h,
    )
    grade = res.json()["grade"]
    return inst, grade


# ────────────────────── Acceso ──────────────────────


def test_non_superadmin_gets_403(client):
    h, _ = _register(client, "plebe")
    res = client.get("/api/v1/admin/overview", headers=h)
    assert res.status_code == 403


def test_anonymous_gets_401(client):
    res = client.get("/api/v1/admin/overview")
    assert res.status_code == 401


def test_superadmin_via_env_email(client, monkeypatch):
    h, _ = _make_superadmin(client, monkeypatch)
    res = client.get("/api/v1/admin/overview", headers=h)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "users" in data and "institutions" in data and "content" in data


def test_admin_of_institution_is_not_superadmin(client):
    """El director de un colegio NO accede al panel global."""
    h, _ = _register(client, "director")
    client.post("/api/v1/institutions", json={"name": "Colegio X"}, headers=h)
    res = client.get("/api/v1/admin/overview", headers=h)
    assert res.status_code == 403


# ────────────────────── Instituciones ──────────────────────


def test_admin_institutions_crud(client, monkeypatch):
    h_root, _ = _make_superadmin(client, monkeypatch)
    h_dir, dir_user = _register(client, "director2")
    inst, _grade = _school(client, h_dir)

    # Lista con conteos
    res = client.get("/api/v1/admin/institutions", headers=h_root)
    assert res.status_code == 200, res.text
    rows = res.json()["institutions"]
    mine = next(i for i in rows if i["id"] == inst["id"])
    assert mine["grades_count"] == 1

    # Detalle
    res = client.get(f"/api/v1/admin/institutions/{inst['id']}", headers=h_root)
    assert res.status_code == 200
    data = res.json()
    assert data["members"]["admins"][0]["id"] == dir_user["id"]

    # Patch: asignar licencia manual
    res = client.patch(
        f"/api/v1/admin/institutions/{inst['id']}",
        json={"seats": 50, "status": "active"},
        headers=h_root,
    )
    assert res.status_code == 200, res.text
    sub = res.json()["institution"]["subscription"]
    assert sub["status"] == "active" and sub["seats"] == 50


def test_admin_suspend_blocks_enrollment(client, monkeypatch):
    h_root, _ = _make_superadmin(client, monkeypatch)
    h_dir, _ = _register(client, "director3")
    inst, grade = _school(client, h_dir)

    res = client.patch(
        f"/api/v1/admin/institutions/{inst['id']}",
        json={"status": "suspended"},
        headers=h_root,
    )
    assert res.status_code == 200

    h_stu, _ = _register(client, "alumno_susp")
    res = client.post(
        "/api/v1/institutions/join", json={"code": grade["join_code"]}, headers=h_stu
    )
    assert res.status_code == 403


def test_admin_create_institution_for_director(client, monkeypatch):
    h_root, _ = _make_superadmin(client, monkeypatch)
    _h_dir, dir_user = _register(client, "newdirector")

    res = client.post(
        "/api/v1/admin/institutions",
        json={"name": "Colegio Gestionado", "admin_email": dir_user["email"]},
        headers=h_root,
    )
    assert res.status_code == 201, res.text
    inst = res.json()["institution"]
    assert dir_user["id"] in inst["admin_ids"]

    # Email inexistente → 404
    res = client.post(
        "/api/v1/admin/institutions",
        json={"name": "Otro", "admin_email": "noexiste@x.com"},
        headers=h_root,
    )
    assert res.status_code == 404


# ────────────────────── Usuarios ──────────────────────


def test_admin_users_search_and_patch(client, monkeypatch):
    h_root, _ = _make_superadmin(client, monkeypatch)
    _h_u, target = _register(client, "victima")

    res = client.get("/api/v1/admin/users", params={"q": "victima"}, headers=h_root)
    assert res.status_code == 200, res.text
    assert any(u["id"] == target["id"] for u in res.json()["users"])

    # Gift Pro
    res = client.patch(
        f"/api/v1/admin/users/{target['id']}",
        json={"plan": "pro"},
        headers=h_root,
    )
    assert res.status_code == 200, res.text
    assert res.json()["user"]["plan"] == "pro"


def test_admin_disable_blocks_account(client, monkeypatch):
    h_root, _ = _make_superadmin(client, monkeypatch)
    h_u, target = _register(client, "baneable")

    res = client.patch(
        f"/api/v1/admin/users/{target['id']}",
        json={"disabled": True},
        headers=h_root,
    )
    assert res.status_code == 200, res.text
    assert res.json()["user"]["disabled"] is True

    # La cuenta suspendida no puede operar la API
    res = client.get("/api/v1/folders", headers=h_u)
    assert res.status_code == 403
    assert res.json()["detail"] == "account_disabled"


def test_admin_cannot_delete_self(client, monkeypatch):
    h_root, root = _make_superadmin(client, monkeypatch)
    res = client.delete(f"/api/v1/admin/users/{root['id']}", headers=h_root)
    assert res.status_code == 400


# ────────────────────── Superadmins / seguridad ──────────────────────


def test_superadmin_lifecycle(client, monkeypatch):
    h_root, root = _make_superadmin(client, monkeypatch)
    _h2, second = _register(client, "segundo")

    # Persistir el rol de root (hoy solo lo tiene vía env bootstrap)
    res = client.post(
        "/api/v1/admin/superadmins", json={"email": root["email"]}, headers=h_root
    )
    assert res.status_code == 200, res.text

    # Elevar por email
    res = client.post(
        "/api/v1/admin/superadmins", json={"email": second["email"]}, headers=h_root
    )
    assert res.status_code == 200, res.text

    # La segunda cuenta ya es superadmin por ROL (sin env)
    monkeypatch.setattr(settings, "SUPERADMIN_EMAILS", "")
    h2 = {"Authorization": f"Bearer {client.post('/api/v1/auth/login', json={'email': second['email'], 'password': 'secreto123'}).json()['token']}"}
    res = client.get("/api/v1/admin/overview", headers=h2)
    assert res.status_code == 200

    # No puedes revocarte a ti mismo
    res = client.delete(f"/api/v1/admin/superadmins/{root['id']}", headers=h_root)
    assert res.status_code == 400

    # Revocar al segundo (root sigue por env bootstrap restaurada en test)
    res = client.delete(f"/api/v1/admin/superadmins/{second['id']}", headers=h_root)
    assert res.status_code == 200
    res = client.get("/api/v1/admin/overview", headers=h2)
    assert res.status_code == 403


def test_admin_security_events_feed(client, monkeypatch):
    h_root, _ = _make_superadmin(client, monkeypatch)
    res = client.get("/api/v1/admin/security-events", headers=h_root)
    assert res.status_code == 200, res.text
    assert "events" in res.json()


def test_admin_system_status(client, monkeypatch):
    h_root, _ = _make_superadmin(client, monkeypatch)
    res = client.get("/api/v1/admin/system", headers=h_root)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "databases" in data and "flags" in data and "integrations" in data
