"""
Configuración de tests: desactiva el rate limiting ANTES de importar la app
(los tests hacen decenas de registros y superarían los límites por minuto).
"""

import os

os.environ["RATE_LIMIT_ENABLED"] = "false"
# HIBP hace una llamada de red real — desactivado por defecto en tests;
# los tests específicos lo ejercitan con monkeypatch.
os.environ["HIBP_ENABLED"] = "false"
# El enrolamiento MFA institucional forzaría a cada test de docentes a
# completar TOTP — desactivado aquí; el gate se prueba con monkeypatch.
os.environ["MFA_ENFORCE_INSTITUTIONS"] = "false"
