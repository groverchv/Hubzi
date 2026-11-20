# -*- coding: utf-8 -*-
"""Genera 3 presentaciones extra: aliados, jueces y padres de familia."""
import base64
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_presentation_clientes import ICONS, CSS, IMG, NAVY, ORANGE, GREEN, YELLOW, BLUE, CYAN

ASSETS = r"D:\Hack\Proyecto\frontend\src\assets"
OUTDIR = os.path.dirname(os.path.abspath(__file__))


def b64(rel):
    with open(os.path.join(ASSETS, rel), "rb") as f:
        return "data:image/webp;base64," + base64.b64encode(f.read()).decode()


IMG2 = {
    "economista": b64("mascots/capy_economista_m.webp"),
    "administradora": b64("mascots/capy_administradora_f.webp"),
    "profesor": b64("mascots/capy_profesor_m.webp"),
    "astronomo": b64("mascots/capy_astronomo_m.webp"),
    "enfermera": b64("mascots/capy_enfermera_f.webp"),
    "historiador": b64("mascots/capy_historiador_m.webp"),
    "escolar_nino": IMG["escolar"],
    "escolar_nina": IMG["escolar_nina"],
    "medica": IMG["medica"],
    "psicologo": IMG["psicologo"],
    "capy3d": IMG["capy3d"],
}


def footer():
    return ('<p style="position:absolute;bottom:26px;left:0;right:0;text-align:center;font-size:14px;'
            'font-weight:700;color:#64748b;letter-spacing:1px;">HUBZI · 2026</p>'
            '<p style="position:absolute;bottom:8px;left:0;right:0;text-align:center;font-size:10.5px;'
            'font-weight:600;color:#94a3b8;letter-spacing:.8px;">Idea de Grover Choque Villca</p>')


def pasos(kicker_txt, icono, color, n):
    return f"""
<div class="slide" style="background:linear-gradient(160deg,#ecfeff,#f0fdf4);padding:64px 72px;align-items:center;text-align:center;">
  <div class="kicker" style="background:{color};color:#fff;"><svg style="width:16px;height:16px">{ICONS[icono]}</svg> {kicker_txt}</div>
  <h2 style="margin-top:28px;">Así funciona</h2>
  <p class="sub" style="margin-top:18px;max-width:780px;">De un documento quieto a un juego de niveles — sin que el estudiante tenga que hacer nada técnico.</p>
  <div style="display:flex;align-items:center;gap:18px;margin-top:52px;">
    <div class="card" style="width:300px;padding:30px 22px;">
      <div class="iconbox" style="background:{BLUE};margin:0 auto 16px;"><svg>{ICONS['doc']}</svg></div>
      <p class="tag" style="color:{BLUE};">Paso 1</p>
      <p style="font-size:20px;font-weight:800;margin-top:6px;">Sube tu material</p>
      <p style="font-size:14px;color:#64748b;font-weight:600;margin-top:6px;">Apuntes, resúmenes, diapositivas o fotos</p>
    </div>
    <svg width="46" height="40" viewBox="0 0 46 40"><path d="M4 20h34m0 0l-10-10m10 10l-10 10" stroke="{NAVY}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".35"/></svg>
    <div class="card" style="width:300px;padding:30px 22px;">
      <div class="iconbox" style="background:{YELLOW};margin:0 auto 16px;"><svg>{ICONS['spark']}</svg></div>
      <p class="tag" style="color:{YELLOW};">Paso 2</p>
      <p style="font-size:20px;font-weight:800;margin-top:6px;">Hubzi crea tu juego</p>
      <p style="font-size:14px;color:#64748b;font-weight:600;margin-top:6px;">Encuentra los temas y escribe preguntas, pistas y cartas</p>
    </div>
    <svg width="46" height="40" viewBox="0 0 46 40"><path d="M4 20h34m0 0l-10-10m10 10l-10 10" stroke="{NAVY}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".35"/></svg>
    <div class="card" style="width:300px;padding:30px 22px;">
      <div class="iconbox" style="background:{GREEN};margin:0 auto 16px;"><svg>{ICONS['game']}</svg></div>
      <p class="tag" style="color:{GREEN};">Paso 3</p>
      <p style="font-size:20px;font-weight:800;margin-top:6px;">Juega y memoriza</p>
      <p style="font-size:14px;color:#64748b;font-weight:600;margin-top:6px;">Aprendes sin darte cuenta, nivel por nivel</p>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">{n}</div>
</div>
"""


def planes(pie):
    return f"""
  <div style="display:flex;gap:20px;margin-top:34px;flex:1;align-items:stretch;">
    <div class="card" style="flex:1;display:flex;flex-direction:column;text-align:center;padding:26px 22px;">
      <p class="tag" style="color:#64748b;">Para probar</p>
      <p style="margin-top:8px;"><span class="bignum" style="font-size:46px;">$0</span></p>
      <p style="font-size:14px;font-weight:800;margin-top:6px;">Estudiante Zen</p>
      <p style="font-size:13.5px;color:#64748b;font-weight:600;margin-top:10px;">Sube apuntes, juega y usa el modo Zen — para siempre gratis.</p>
    </div>
    <div class="card" style="flex:1;display:flex;flex-direction:column;text-align:center;padding:26px 22px;background:{NAVY};color:#fff;position:relative;">
      <div style="position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,{ORANGE},{YELLOW});color:{NAVY};font-size:11.5px;font-weight:900;letter-spacing:1.5px;padding:6px 18px;border-radius:99px;text-transform:uppercase;">Más popular</div>
      <p class="tag" style="color:{YELLOW};">Todo completo</p>
      <p style="margin-top:8px;"><span class="bignum" style="font-size:46px;color:{YELLOW};">$2.99</span><span style="font-size:14px;font-weight:700;color:#cbd5e1;"> /mes</span></p>
      <p style="font-size:14px;font-weight:800;margin-top:6px;">Hubzy Pro</p>
      <p style="font-size:13.5px;color:#cbd5e1;font-weight:600;margin-top:10px;">Material sin límite, los 20 niveles completos y la voz premium de Hubzi.</p>
    </div>
    <div class="card" style="flex:1;display:flex;flex-direction:column;text-align:center;padding:26px 22px;background:linear-gradient(160deg,#065f46,#047857);color:#fff;">
      <p class="tag" style="color:#6ee7b7;">Colegios</p>
      <p style="margin-top:8px;"><span class="bignum" style="font-size:46px;color:#6ee7b7;">$1</span><span style="font-size:14px;font-weight:700;color:#d1fae5;"> /est./mes</span></p>
      <p style="font-size:14px;font-weight:800;margin-top:6px;">Hubzy Escuelas</p>
      <p style="font-size:13.5px;color:#d1fae5;font-weight:600;margin-top:10px;">Toda la experiencia para estudiantes, con panel docente incluido.</p>
    </div>
  </div>
  {pie}
"""


def edades(n):
    return f"""
<div class="slide" style="background:linear-gradient(160deg,#fefce8,#f0f9ff);padding:52px 72px;">
  <div class="kicker" style="background:{ORANGE};color:#fff;"><svg style="width:16px;height:16px">{ICONS['users']}</svg> Crece contigo</div>
  <h2 style="margin-top:18px;font-size:38px;">De los 4 años a la universidad</h2>
  <p class="sub" style="margin-top:12px;max-width:840px;">El juego se adapta a la edad: las preguntas, el tono de Hubzi, la dificultad y el tiempo de cada sesión cambian contigo.</p>
  <div style="display:flex;gap:14px;flex:1;align-items:center;">
    <div class="card" style="flex:1;text-align:center;padding:24px 8px;background:#fef3c7;"><p class="bignum" style="font-size:38px;color:{ORANGE};">4-7</p><p style="font-size:15px;font-weight:800;margin-top:6px;">Semillita</p><p style="font-size:12.5px;color:#78716c;font-weight:600;margin-top:4px;">Se lee todo en voz alta,<br/>cero presión</p></div>
    <div class="card" style="flex:1;text-align:center;padding:24px 8px;background:#fef9c3;"><p class="bignum" style="font-size:38px;color:{YELLOW};">8-10</p><p style="font-size:15px;font-weight:800;margin-top:6px;">Explorador</p><p style="font-size:12.5px;color:#78716c;font-weight:600;margin-top:4px;">Pistas gratis,<br/>mapa de mundos</p></div>
    <div class="card" style="flex:1;text-align:center;padding:24px 8px;background:#ecfccb;"><p class="bignum" style="font-size:38px;color:{GREEN};">11-14</p><p style="font-size:15px;font-weight:800;margin-top:6px;">Aventurero</p><p style="font-size:12.5px;color:#78716c;font-weight:600;margin-top:4px;">Más reto,<br/>compañera de equipo</p></div>
    <div class="card" style="flex:1;text-align:center;padding:24px 8px;background:#dcfce7;"><p class="bignum" style="font-size:38px;color:{GREEN};">15-18</p><p style="font-size:15px;font-weight:800;margin-top:6px;">Retador</p><p style="font-size:12.5px;color:#78716c;font-weight:600;margin-top:4px;">Secundaria<br/>y exámenes</p></div>
    <div class="card" style="flex:1;text-align:center;padding:24px 8px;background:#e0f2fe;"><p class="bignum" style="font-size:38px;color:{BLUE};">19+</p><p style="font-size:15px;font-weight:800;margin-top:6px;">Académico</p><p style="font-size:12.5px;color:#78716c;font-weight:600;margin-top:4px;">Universidad<br/>y más allá</p></div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">{n}</div>
</div>
"""


def colegio(n):
    return f"""
<div class="slide" style="background:linear-gradient(160deg,#ecfdf5,#f0fdf4);padding:56px 72px;">
  <div class="kicker" style="background:#059669;color:#fff;"><svg style="width:16px;height:16px">{ICONS['school']}</svg> Para colegios</div>
  <div style="display:flex;gap:44px;margin-top:22px;flex:1;align-items:center;">
    <div style="flex:1;">
      <h2>El aula entera,<br/><span style="color:#059669;">en un mapa</span></h2>
      <p class="sub" style="margin-top:12px;">Los docentes organizan cursos y materias; los estudiantes entran con un simple código de clase.</p>
      <div style="display:flex;flex-direction:column;gap:13px;margin-top:24px;">
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:44px;height:44px;border-radius:14px;background:#059669;"><svg style="width:23px;height:23px">{ICONS['users']}</svg></div><p style="font-size:16px;font-weight:700;">Registro por código de clase o lista completa</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:44px;height:44px;border-radius:14px;background:#059669;"><svg style="width:23px;height:23px">{ICONS['book']}</svg></div><p style="font-size:16px;font-weight:700;">Materias e islas asignadas por curso</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:44px;height:44px;border-radius:14px;background:#059669;"><svg style="width:23px;height:23px">{ICONS['doc']}</svg></div><p style="font-size:16px;font-weight:700;">Reportes por estudiante, listos para imprimir</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:44px;height:44px;border-radius:14px;background:#059669;"><svg style="width:23px;height:23px">{ICONS['lock']}</svg></div><p style="font-size:16px;font-weight:700;">Privacidad de menores: solo avances, jamás conversaciones</p></div>
      </div>
    </div>
    <div class="card" style="width:430px;padding:30px;background:#fff;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <p class="tag" style="color:#059669;">Así ve el docente</p>
        <span style="font-size:11px;font-weight:700;color:#94a3b8;">ejemplo</span>
      </div>
      <p style="font-size:18px;font-weight:800;margin-top:8px;">¿En qué temas falla mi curso?</p>
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:18px;">
        <div><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;"><span>Fracciones</span><span style="color:#ef4444;">38%</span></div><div style="height:12px;background:#f1f5f9;border-radius:99px;margin-top:5px;"><div style="width:38%;height:100%;background:#ef4444;border-radius:99px;"></div></div></div>
        <div><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;"><span>Ecuaciones</span><span style="color:{ORANGE};">55%</span></div><div style="height:12px;background:#f1f5f9;border-radius:99px;margin-top:5px;"><div style="width:55%;height:100%;background:{ORANGE};border-radius:99px;"></div></div></div>
        <div><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;"><span>Geometría</span><span style="color:{GREEN};">81%</span></div><div style="height:12px;background:#f1f5f9;border-radius:99px;margin-top:5px;"><div style="width:81%;height:100%;background:{GREEN};border-radius:99px;"></div></div></div>
        <div><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;"><span>Álgebra</span><span style="color:{GREEN};">74%</span></div><div style="height:12px;background:#f1f5f9;border-radius:99px;margin-top:5px;"><div style="width:74%;height:100%;background:{GREEN};border-radius:99px;"></div></div></div>
      </div>
      <div style="margin-top:18px;padding:12px 16px;background:#f0fdf4;border-radius:14px;border-left:4px solid #059669;">
        <p style="font-size:13px;font-weight:700;color:#166534;">Intervenir antes del examen, no después del reprobado.</p>
      </div>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">{n}</div>
</div>
"""


# ================================================================ ALIADOS
ALIADOS = []

ALIADOS.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#eff6ff,#f0fdf4);align-items:center;justify-content:center;">
  <div class="dot" style="top:-90px;right:-60px;width:280px;height:280px;background:{BLUE};opacity:.16;"></div>
  <div class="dot" style="bottom:-110px;left:-70px;width:320px;height:320px;background:{GREEN};opacity:.14;"></div>
  <div class="dot" style="top:130px;left:110px;width:30px;height:30px;background:{YELLOW};opacity:.5;"></div>
  <div style="display:flex;align-items:center;gap:64px;position:relative;">
    <div style="text-align:left;max-width:640px;">
      <div class="kicker"><svg style="width:16px;height:16px">{ICONS['users']}</svg> Alianzas</div>
      <h1 style="margin-top:26px;">Crecemos<br/>mejor<br/><span style="color:{ORANGE};">juntos</span></h1>
      <p class="sub" style="margin-top:20px;max-width:540px;">Hubzi convierte el material de estudio en un juego que también cuida la calma de quien aprende — y ya funciona.</p>
      <div style="display:flex;gap:12px;margin-top:30px;">
        <span class="chip" style="background:{NAVY};color:{YELLOW};font-size:16px;padding:12px 22px;"><svg style="width:16px;height:16px">{ICONS['check']}</svg> Producto construido</span>
        <span class="chip" style="background:#fff;color:{NAVY};box-shadow:0 3px 0 rgba(18,36,67,.15)"><svg style="width:16px;height:16px;color:{GREEN}">{ICONS['chart']}</svg> Modelo claro</span>
      </div>
    </div>
    <div style="width:340px;height:340px;background:#fff;border-radius:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 0 rgba(18,36,67,.1),0 24px 48px rgba(18,36,67,.12);">
      <img src="{IMG2['economista']}" style="width:300px;height:300px;object-fit:contain;"/>
    </div>
  </div>
  <p style="position:absolute;bottom:26px;left:0;right:0;text-align:center;font-size:14px;font-weight:700;color:#64748b;letter-spacing:1px;">HUBZI · 2026</p>
</div>
""")

ALIADOS.append(f"""
<div class="slide" style="background:#f8fafc;padding:64px 72px;">
  <div class="kicker" style="background:{ORANGE};color:#fff;"><svg style="width:16px;height:16px">{ICONS['zap']}</svg> La oportunidad</div>
  <h2 style="margin-top:24px;">Estudiar sigue siendo<br/><span style="color:{ORANGE};">pesado y solitario</span></h2>
  <div style="display:flex;gap:28px;margin-top:52px;flex:1;align-items:center;">
    <div class="card" style="flex:1;display:flex;flex-direction:column;gap:16px;height:280px;justify-content:center;">
      <div class="iconbox" style="background:#e0f2fe;"><svg style="color:{BLUE}">{ICONS['book']}</svg></div>
      <p style="font-size:19px;font-weight:800;">Releer no es aprender</p>
      <p style="font-size:15px;color:#64748b;font-weight:600;">Los estudiantes repasan apuntes quietos y olvidan la mayoría en pocos días.</p>
    </div>
    <div class="card" style="flex:1;display:flex;flex-direction:column;gap:16px;height:280px;justify-content:center;">
      <div class="iconbox" style="background:#fee2e2;"><svg style="color:#ef4444">{ICONS['moon']}</svg></div>
      <p style="font-size:19px;font-weight:800;">Los nervios ganan</p>
      <p style="font-size:15px;color:#64748b;font-weight:600;">El bloqueo antes de un examen empieza desde la infancia y casi nadie lo trabaja.</p>
    </div>
    <div class="card" style="flex:1;display:flex;flex-direction:column;gap:16px;height:280px;justify-content:center;">
      <div class="iconbox" style="background:#dcfce7;"><svg style="color:{GREEN}">{ICONS['infinity']}</svg></div>
      <p style="font-size:19px;font-weight:800;">Las apps se quedan cortas</p>
      <p style="font-size:15px;color:#64748b;font-weight:600;">Unas solo hacen tarjetas, otras solo un idioma. Nadie convierte <em>cualquier</em> apunte en juego.</p>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">02</div>
</div>
""")

ALIADOS.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#ecfeff,#f0fdf4);padding:64px 72px;align-items:center;text-align:center;">
  <div class="kicker"><svg style="width:16px;height:16px">{ICONS['spark']}</svg> Qué es Hubzi</div>
  <h2 style="margin-top:28px;">Los apuntes se vuelven<br/><span style="color:{GREEN};">un juego de niveles</span></h2>
  <p class="sub" style="margin-top:20px;max-width:820px;">Subes un documento y en segundos hay una aventura de preguntas, cartas y niveles — con una capibara compañera que también cuida la calma del estudiante.</p>
  <div style="display:flex;gap:16px;margin-top:48px;justify-content:center;">
    <span class="chip" style="background:{NAVY};color:#fff;font-size:16px;padding:12px 24px;"><svg style="width:17px;height:17px">{ICONS['infinity']}</svg> Cualquier materia</span>
    <span class="chip" style="background:{GREEN};color:#fff;font-size:16px;padding:12px 24px;"><svg style="width:17px;height:17px">{ICONS['users']}</svg> De 4 a 20 años</span>
    <span class="chip" style="background:{CYAN};color:#fff;font-size:16px;padding:12px 24px;"><svg style="width:17px;height:17px">{ICONS['wind']}</svg> Diseño anti-estrés</span>
    <span class="chip" style="background:#fff;color:{NAVY};font-size:16px;padding:12px 24px;box-shadow:0 3px 0 rgba(18,36,67,.15)"><svg style="width:17px;height:17px;color:{ORANGE}">{ICONS['school']}</svg> También para colegios</span>
  </div>
  <div style="margin-top:56px;display:flex;justify-content:center;">
    <img src="{IMG2['escolar_nino']}" style="width:200px;height:200px;object-fit:contain;background:#fff;border-radius:28px;padding:10px;box-shadow:0 5px 0 rgba(18,36,67,.09),0 18px 40px rgba(18,36,67,.1);"/>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">03</div>
</div>
""")

ALIADOS.append(pasos("Cómo funciona", "rocket", NAVY, "04"))

ALIADOS.append(f"""
<div class="slide" style="background:#f8fafc;padding:56px 72px;">
  <div class="kicker" style="background:{BLUE};color:#fff;"><svg style="width:16px;height:16px">{ICONS['star']}</svg> Diferenciadores</div>
  <h2 style="margin-top:20px;">Lo que nadie más<br/><span style="color:{BLUE};">juntó en un solo lugar</span></h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:36px;flex:1;align-content:center;">
    <div class="card" style="display:flex;gap:18px;align-items:center;padding:24px 28px;">
      <div class="iconbox" style="background:{ORANGE};"><svg>{ICONS['infinity']}</svg></div>
      <div><p style="font-size:18px;font-weight:800;">Sin límite de contenido</p><p style="font-size:14px;color:#64748b;font-weight:600;">Matemática, ciencias, idiomas, derecho, primaria o universidad — cualquier material sirve.</p></div>
    </div>
    <div class="card" style="display:flex;gap:18px;align-items:center;padding:24px 28px;">
      <div class="iconbox" style="background:{CYAN};"><svg>{ICONS['wind']}</svg></div>
      <div><p style="font-size:18px;font-weight:800;">Diseño anti-estrés</p><p style="font-size:14px;color:#64748b;font-weight:600;">Sin vidas, sin relojes, sin "perdiste" — más ejercicios de calma integrados.</p></div>
    </div>
    <div class="card" style="display:flex;gap:18px;align-items:center;padding:24px 28px;">
      <div class="iconbox" style="background:{GREEN};"><svg>{ICONS['paw']}</svg></div>
      <div><p style="font-size:18px;font-weight:800;">Una compañera con voz</p><p style="font-size:14px;color:#64748b;font-weight:600;">La capibara habla, anima y nota la frustración — nadie estudia solo.</p></div>
    </div>
    <div class="card" style="display:flex;gap:18px;align-items:center;padding:24px 28px;">
      <div class="iconbox" style="background:#059669;"><svg>{ICONS['school']}</svg></div>
      <div><p style="font-size:18px;font-weight:800;">Del hogar al aula</p><p style="font-size:14px;color:#64748b;font-weight:600;">El mismo juego funciona en casa y en colegios, con panel para docentes.</p></div>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">05</div>
</div>
""")

ALIADOS.append(colegio("06"))

ALIADOS.append(f"""
<div class="slide" style="background:#f0f9ff;padding:56px 72px;">
  <div class="kicker" style="background:{BLUE};color:#fff;"><svg style="width:16px;height:16px">{ICONS['chart']}</svg> Modelo de negocio</div>
  <h2 style="margin-top:20px;">Tres puertas de entrada,<br/><span style="color:{BLUE};">un mismo juego</span></h2>
  {planes('<div class="brand">Hubzi</div><div class="pageno">07</div>')}
</div>
""")

ALIADOS.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#f0fdf4,#fefce8);padding:56px 72px;">
  <div class="kicker" style="background:{GREEN};color:#fff;"><svg style="width:16px;height:16px">{ICONS['check']}</svg> Estado actual</div>
  <div style="display:flex;gap:44px;margin-top:22px;flex:1;align-items:center;">
    <div style="flex:1;">
      <h2>Ya existe<br/><span style="color:{GREEN};">y funciona</span></h2>
      <p class="sub" style="margin-top:12px;">No es una idea en papel: la plataforma está construida y en funcionamiento.</p>
      <div style="display:flex;flex-direction:column;gap:13px;margin-top:24px;">
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:44px;height:44px;border-radius:14px;background:{GREEN};"><svg style="width:23px;height:23px">{ICONS['game']}</svg></div><p style="font-size:16px;font-weight:700;">El juego de niveles completo</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:44px;height:44px;border-radius:14px;background:{CYAN};"><svg style="width:23px;height:23px">{ICONS['wind']}</svg></div><p style="font-size:16px;font-weight:700;">Modo Zen con ejercicios de calma</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:44px;height:44px;border-radius:14px;background:{BLUE};"><svg style="width:23px;height:23px">{ICONS['msg']}</svg></div><p style="font-size:16px;font-weight:700;">Pregúntale a tus apuntes</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:44px;height:44px;border-radius:14px;background:#059669;"><svg style="width:23px;height:23px">{ICONS['school']}</svg></div><p style="font-size:16px;font-weight:700;">Panel docente y planes activos</p></div>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:center;flex:1;">
      <div style="width:300px;height:300px;background:#fff;border-radius:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 5px 0 rgba(18,36,67,.09),0 18px 40px rgba(18,36,67,.1);">
        <img src="{IMG2['administradora']}" style="width:264px;height:264px;object-fit:contain;"/>
      </div>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">08</div>
</div>
""")

ALIADOS.append(f"""
<div class="slide" style="background:#f8fafc;padding:56px 72px;">
  <div class="kicker" style="background:{ORANGE};color:#fff;"><svg style="width:16px;height:16px">{ICONS['users']}</svg> Lo que buscamos</div>
  <h2 style="margin-top:20px;">Dónde suma<br/><span style="color:{ORANGE};">un aliado</span></h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:36px;flex:1;align-content:center;">
    <div class="card" style="display:flex;gap:18px;align-items:center;padding:26px 28px;">
      <div class="iconbox" style="background:{GREEN};"><svg>{ICONS['school']}</svg></div>
      <div><p style="font-size:18px;font-weight:800;">Puertas a colegios</p><p style="font-size:14px;color:#64748b;font-weight:600;">Contactos con colegios y docentes para llevar Hubzi al aula.</p></div>
    </div>
    <div class="card" style="display:flex;gap:18px;align-items:center;padding:26px 28px;">
      <div class="iconbox" style="background:{BLUE};"><svg>{ICONS['book']}</svg></div>
      <div><p style="font-size:18px;font-weight:800;">Contenido educativo</p><p style="font-size:14px;color:#64748b;font-weight:600;">Material propio, editoriales o guías listas para convertir en juego.</p></div>
    </div>
    <div class="card" style="display:flex;gap:18px;align-items:center;padding:26px 28px;">
      <div class="iconbox" style="background:{ORANGE};"><svg>{ICONS['zap']}</svg></div>
      <div><p style="font-size:18px;font-weight:800;">Impulso para crecer</p><p style="font-size:14px;color:#64748b;font-weight:600;">Inversión o mentoría para llegar a más estudiantes más rápido.</p></div>
    </div>
    <div class="card" style="display:flex;gap:18px;align-items:center;padding:26px 28px;">
      <div class="iconbox" style="background:#a855f7;"><svg>{ICONS['msg']}</svg></div>
      <div><p style="font-size:18px;font-weight:800;">Voz y alcance</p><p style="font-size:14px;color:#64748b;font-weight:600;">Canales para contar la historia y llegar a familias y docentes.</p></div>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">09</div>
</div>
""")

ALIADOS.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#eff6ff,#f0fdf4);align-items:center;justify-content:center;">
  <div class="dot" style="top:-80px;left:-80px;width:280px;height:280px;background:{BLUE};opacity:.15;"></div>
  <div class="dot" style="bottom:-100px;right:-60px;width:300px;height:300px;background:{YELLOW};opacity:.18;"></div>
  <div style="text-align:center;display:flex;flex-direction:column;align-items:center;">
    <div class="kicker"><svg style="width:16px;height:16px">{ICONS['rocket']}</svg> El siguiente paso</div>
    <h1 style="margin-top:30px;font-size:80px;">Construyamos<br/><span style="color:{ORANGE};">juntos</span></h1>
    <p class="sub" style="margin-top:22px;max-width:640px;">Un producto que ya funciona, un modelo claro y un público enorme esperando una forma mejor de estudiar.</p>
    <div style="width:220px;height:220px;background:#fff;border-radius:32px;display:flex;align-items:center;justify-content:center;margin-top:38px;box-shadow:0 5px 0 rgba(18,36,67,.1),0 18px 40px rgba(18,36,67,.12);">
      <img src="{IMG2['capy3d']}" style="width:190px;height:190px;object-fit:contain;"/>
    </div>
  </div>
  {footer()}
</div>
""")

# ================================================================ JUECES
JUECES = []

JUECES.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#fefce8,#f0f9ff);align-items:center;justify-content:center;">
  <div class="dot" style="top:-90px;right:-60px;width:280px;height:280px;background:{YELLOW};opacity:.2;"></div>
  <div class="dot" style="bottom:-110px;left:-70px;width:320px;height:320px;background:{CYAN};opacity:.16;"></div>
  <div class="dot" style="top:130px;left:110px;width:30px;height:30px;background:{ORANGE};opacity:.5;"></div>
  <div style="display:flex;align-items:center;gap:64px;position:relative;">
    <div style="text-align:left;max-width:640px;">
      <div class="kicker"><svg style="width:16px;height:16px">{ICONS['star']}</svg> Hubzi</div>
      <h1 style="margin-top:26px;">El estudio,<br/>convertido<br/><span style="color:{ORANGE};">en juego</span></h1>
      <p class="sub" style="margin-top:20px;max-width:540px;">Una plataforma que transforma cualquier material en una aventura de niveles — con una capibara que cuida la calma de quien aprende.</p>
      <div style="display:flex;gap:12px;margin-top:30px;">
        <span class="chip" style="background:{NAVY};color:{YELLOW};font-size:16px;padding:12px 22px;"><svg style="width:16px;height:16px">{ICONS['check']}</svg> Funcionando hoy</span>
        <span class="chip" style="background:#fff;color:{NAVY};box-shadow:0 3px 0 rgba(18,36,67,.15)"><svg style="width:16px;height:16px;color:{GREEN}">{ICONS['users']}</svg> De 4 a 20 años</span>
      </div>
    </div>
    <div style="width:340px;height:340px;background:#fff;border-radius:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 0 rgba(18,36,67,.1),0 24px 48px rgba(18,36,67,.12);">
      <img src="{IMG2['profesor']}" style="width:300px;height:300px;object-fit:contain;"/>
    </div>
  </div>
  <p style="position:absolute;bottom:26px;left:0;right:0;text-align:center;font-size:14px;font-weight:700;color:#64748b;letter-spacing:1px;">HUBZI · 2026</p>
</div>
""")

JUECES.append(f"""
<div class="slide" style="background:#f8fafc;padding:64px 72px;">
  <div class="kicker" style="background:{ORANGE};color:#fff;"><svg style="width:16px;height:16px">{ICONS['zap']}</svg> El problema</div>
  <h2 style="margin-top:24px;">Estudiar es<br/><span style="color:{ORANGE};">la parte que nadie arregló</span></h2>
  <div style="display:flex;gap:28px;margin-top:52px;flex:1;align-items:center;">
    <div class="card" style="flex:1;display:flex;flex-direction:column;gap:16px;height:280px;justify-content:center;">
      <div class="iconbox" style="background:#e2e8f0;"><svg style="color:#64748b">{ICONS['book']}</svg></div>
      <p style="font-size:19px;font-weight:800;">Releer no funciona</p>
      <p style="font-size:15px;color:#64748b;font-weight:600;">El método más usado para estudiar es también el menos efectivo — y el más aburrido.</p>
    </div>
    <div class="card" style="flex:1;display:flex;flex-direction:column;gap:16px;height:280px;justify-content:center;">
      <div class="iconbox" style="background:#fee2e2;"><svg style="color:#ef4444">{ICONS['moon']}</svg></div>
      <p style="font-size:19px;font-weight:800;">Los nervios ganan</p>
      <p style="font-size:15px;color:#64748b;font-weight:600;">El bloqueo antes de un examen existe desde la infancia. Casi ninguna herramienta lo atiende.</p>
    </div>
    <div class="card" style="flex:1;display:flex;flex-direction:column;gap:16px;height:280px;justify-content:center;">
      <div class="iconbox" style="background:#fef3c7;"><svg style="color:{ORANGE}">{ICONS['users']}</svg></div>
      <p style="font-size:19px;font-weight:800;">Estudiar solo pesa</p>
      <p style="font-size:15px;color:#64748b;font-weight:600;">Sin acompañamiento ni motivación, la constancia se cae en pocos días.</p>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">02</div>
</div>
""")

JUECES.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#ecfeff,#f0fdf4);padding:64px 72px;align-items:center;text-align:center;">
  <div class="kicker" style="background:{GREEN};color:#fff;"><svg style="width:16px;height:16px">{ICONS['spark']}</svg> La solución</div>
  <h2 style="margin-top:28px;">Cualquier apunte,<br/><span style="color:{GREEN};">un juego de niveles</span></h2>
  <p class="sub" style="margin-top:20px;max-width:820px;">El estudiante sube su material; Hubzi encuentra los temas, crea preguntas y lo convierte todo en una aventura — con una capibara compañera que anima y calma.</p>
  <div style="display:flex;gap:16px;margin-top:48px;justify-content:center;">
    <span class="chip" style="background:{NAVY};color:#fff;font-size:16px;padding:12px 24px;"><svg style="width:17px;height:17px">{ICONS['infinity']}</svg> Cualquier materia</span>
    <span class="chip" style="background:{GREEN};color:#fff;font-size:16px;padding:12px 24px;"><svg style="width:17px;height:17px">{ICONS['game']}</svg> Juego sin castigo</span>
    <span class="chip" style="background:{CYAN};color:#fff;font-size:16px;padding:12px 24px;"><svg style="width:17px;height:17px">{ICONS['wind']}</svg> Calma integrada</span>
    <span class="chip" style="background:#fff;color:{NAVY};font-size:16px;padding:12px 24px;box-shadow:0 3px 0 rgba(18,36,67,.15)"><svg style="width:17px;height:17px;color:{ORANGE}">{ICONS['school']}</svg> Lista para colegios</span>
  </div>
  <div style="margin-top:56px;display:flex;justify-content:center;">
    <img src="{IMG2['escolar_nina']}" style="width:200px;height:200px;object-fit:contain;background:#fff;border-radius:28px;padding:10px;box-shadow:0 5px 0 rgba(18,36,67,.09),0 18px 40px rgba(18,36,67,.1);"/>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">03</div>
</div>
""")

JUECES.append(pasos("Cómo funciona", "rocket", NAVY, "04"))

JUECES.append(f"""
<div class="slide" style="background:#f8fafc;padding:56px 72px;">
  <div class="kicker" style="background:{BLUE};color:#fff;"><svg style="width:16px;height:16px">{ICONS['star']}</svg> Lo que la hace distinta</div>
  <h2 style="margin-top:20px;">Cinco decisiones<br/><span style="color:{BLUE};">que nadie más tomó</span></h2>
  <div style="display:flex;flex-direction:column;gap:11px;margin-top:24px;flex:1;justify-content:center;">
    <div class="card" style="display:flex;gap:16px;align-items:center;padding:15px 24px;">
      <div class="iconbox" style="width:46px;height:46px;background:{ORANGE};"><svg style="width:24px;height:24px">{ICONS['heart']}</svg></div>
      <div><p style="font-size:16.5px;font-weight:800;">Sin vidas, sin relojes, sin "perdiste"</p><p style="font-size:13px;color:#64748b;font-weight:600;">El diseño anti-estrés está en la base del juego, no es un extra.</p></div>
    </div>
    <div class="card" style="display:flex;gap:16px;align-items:center;padding:15px 24px;">
      <div class="iconbox" style="width:46px;height:46px;background:{GREEN};"><svg style="width:24px;height:24px">{ICONS['paw']}</svg></div>
      <div><p style="font-size:16.5px;font-weight:800;">Una compañera que nota cómo estás</p><p style="font-size:13px;color:#64748b;font-weight:600;">La capibara habla, celebra, detecta frustración y baja el ritmo sola.</p></div>
    </div>
    <div class="card" style="display:flex;gap:16px;align-items:center;padding:15px 24px;">
      <div class="iconbox" style="width:46px;height:46px;background:{CYAN};"><svg style="width:24px;height:24px">{ICONS['wind']}</svg></div>
      <div><p style="font-size:16.5px;font-weight:800;">Calma dentro del estudio</p><p style="font-size:13px;color:#64748b;font-weight:600;">Ejercicios de respiración y enfoque a un toque — y si alguien está muy mal, muestra dónde pedir ayuda real.</p></div>
    </div>
    <div class="card" style="display:flex;gap:16px;align-items:center;padding:15px 24px;">
      <div class="iconbox" style="width:46px;height:46px;background:{BLUE};"><svg style="width:24px;height:24px">{ICONS['infinity']}</svg></div>
      <div><p style="font-size:16.5px;font-weight:800;">Cualquier materia, cualquier edad</p><p style="font-size:13px;color:#64748b;font-weight:600;">De los 4 años a la universidad: el juego se adapta en tono, dificultad y tiempo.</p></div>
    </div>
    <div class="card" style="display:flex;gap:16px;align-items:center;padding:15px 24px;">
      <div class="iconbox" style="width:46px;height:46px;background:#059669;"><svg style="width:24px;height:24px">{ICONS['chart']}</svg></div>
      <div><p style="font-size:16.5px;font-weight:800;">Datos útiles para el aula</p><p style="font-size:13px;color:#64748b;font-weight:600;">El docente ve qué temas fallan en su curso antes del examen.</p></div>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">05</div>
</div>
""")

JUECES.append(f"""
<div class="slide" style="background:#f0f9ff;padding:56px 72px;">
  <div class="kicker" style="background:{GREEN};color:#fff;"><svg style="width:16px;height:16px">{ICONS['game']}</svg> El juego</div>
  <div style="display:flex;gap:48px;margin-top:24px;flex:1;align-items:center;">
    <div style="flex:1.15;">
      <h2>Un mapa de islas<br/>por materia</h2>
      <p class="sub" style="margin-top:14px;">Cada tema del documento se convierte en una isla con su propia campaña de niveles.</p>
      <div style="display:flex;flex-direction:column;gap:14px;margin-top:28px;">
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{GREEN};"><svg style="width:24px;height:24px">{ICONS['island']}</svg></div><p style="font-size:17px;font-weight:700;">Una isla por cada tema</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{BLUE};"><svg style="width:24px;height:24px">{ICONS['chart']}</svg></div><p style="font-size:17px;font-weight:700;">20 niveles que suben contigo</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{YELLOW};"><svg style="width:24px;height:24px">{ICONS['spark']}</svg></div><p style="font-size:17px;font-weight:700;">Cartas trampa que desaparecen al aprender</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{ORANGE};"><svg style="width:24px;height:24px">{ICONS['zap']}</svg></div><p style="font-size:17px;font-weight:700;">Racha diaria que solo suma</p></div>
      </div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;gap:14px;">
      <div class="card" style="background:{NAVY};color:#fff;padding:26px 28px;">
        <p class="tag" style="color:{YELLOW};">Juega tranquilo</p>
        <p style="font-size:24px;font-weight:900;margin-top:8px;line-height:1.35;">Sin vidas. Sin relojes.<br/>Sin "perdiste".</p>
      </div>
      <div class="card" style="padding:20px 26px;display:flex;align-items:center;gap:16px;">
        <div class="iconbox" style="width:52px;height:52px;background:#dcfce7;"><svg style="width:28px;height:28px;color:{GREEN}">{ICONS['check']}</svg></div>
        <p style="font-size:17px;font-weight:700;">Equivocarte no castiga: cada fallo abre una pista.</p>
      </div>
      <div class="card" style="padding:20px 26px;display:flex;align-items:center;gap:16px;">
        <div class="iconbox" style="width:52px;height:52px;background:#fef3c7;"><svg style="width:28px;height:28px;color:{ORANGE}">{ICONS['smile']}</svg></div>
        <p style="font-size:17px;font-weight:700;">El reto crece contigo: sube cuando dominas, baja si necesitas repaso.</p>
      </div>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">06</div>
</div>
""")

JUECES.append(edades("07"))

JUECES.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#f0fdf4,#fefce8);padding:56px 72px;">
  <div class="kicker" style="background:{GREEN};color:#fff;"><svg style="width:16px;height:16px">{ICONS['check']}</svg> Lo construido</div>
  <div style="display:flex;gap:44px;margin-top:22px;flex:1;align-items:center;">
    <div style="flex:1;">
      <h2>Esto no es una idea:<br/><span style="color:{GREEN};">ya funciona</span></h2>
      <p class="sub" style="margin-top:12px;">Todo lo mostrado hoy existe y corre en la aplicación.</p>
      <div style="display:flex;flex-direction:column;gap:13px;margin-top:24px;">
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:44px;height:44px;border-radius:14px;background:{GREEN};"><svg style="width:23px;height:23px">{ICONS['game']}</svg></div><p style="font-size:16px;font-weight:700;">El juego completo con islas y niveles</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:44px;height:44px;border-radius:14px;background:{CYAN};"><svg style="width:23px;height:23px">{ICONS['wind']}</svg></div><p style="font-size:16px;font-weight:700;">Modo Zen + detección de crisis</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:44px;height:44px;border-radius:14px;background:{BLUE};"><svg style="width:23px;height:23px">{ICONS['msg']}</svg></div><p style="font-size:16px;font-weight:700;">Chat con tus propios apuntes</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:44px;height:44px;border-radius:14px;background:#059669;"><svg style="width:23px;height:23px">{ICONS['school']}</svg></div><p style="font-size:16px;font-weight:700;">Panel docente, códigos de clase y planes</p></div>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:center;flex:1;">
      <div style="width:300px;height:300px;background:#fff;border-radius:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 5px 0 rgba(18,36,67,.09),0 18px 40px rgba(18,36,67,.1);">
        <img src="{IMG2['astronomo']}" style="width:264px;height:264px;object-fit:contain;"/>
      </div>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">08</div>
</div>
""")

JUECES.append(f"""
<div class="slide" style="background:#f0f9ff;padding:56px 72px;">
  <div class="kicker" style="background:{BLUE};color:#fff;"><svg style="width:16px;height:16px">{ICONS['chart']}</svg> Sostenibilidad</div>
  <h2 style="margin-top:20px;">Un modelo simple<br/><span style="color:{BLUE};">para sostenerse</span></h2>
  {planes('<div class="brand">Hubzi</div><div class="pageno">09</div>')}
</div>
""")

JUECES.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#fefce8,#f0f9ff);align-items:center;justify-content:center;">
  <div class="dot" style="top:-80px;left:-80px;width:280px;height:280px;background:{YELLOW};opacity:.2;"></div>
  <div class="dot" style="bottom:-100px;right:-60px;width:300px;height:300px;background:{CYAN};opacity:.16;"></div>
  <div style="text-align:center;display:flex;flex-direction:column;align-items:center;">
    <div class="kicker"><svg style="width:16px;height:16px">{ICONS['star']}</svg> Hubzi</div>
    <h1 style="margin-top:30px;font-size:76px;">Aprender sin<br/><span style="color:{ORANGE};">miedo a fallar</span></h1>
    <p class="sub" style="margin-top:22px;max-width:640px;">El estudio puede ser un juego que también te calma — y ya está construido.</p>
    <div style="width:220px;height:220px;background:#fff;border-radius:32px;display:flex;align-items:center;justify-content:center;margin-top:38px;box-shadow:0 5px 0 rgba(18,36,67,.1),0 18px 40px rgba(18,36,67,.12);">
      <img src="{IMG2['capy3d']}" style="width:190px;height:190px;object-fit:contain;"/>
    </div>
  </div>
  {footer()}
</div>
""")

# ================================================================ PADRES
PADRES = []

PADRES.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#fef3c7,#f0fdf4);align-items:center;justify-content:center;">
  <div class="dot" style="top:-90px;right:-60px;width:280px;height:280px;background:{ORANGE};opacity:.14;"></div>
  <div class="dot" style="bottom:-110px;left:-70px;width:320px;height:320px;background:{GREEN};opacity:.14;"></div>
  <div class="dot" style="top:130px;left:110px;width:30px;height:30px;background:{BLUE};opacity:.4;"></div>
  <div style="display:flex;align-items:center;gap:64px;position:relative;">
    <div style="text-align:left;max-width:640px;">
      <div class="kicker" style="background:{ORANGE};color:#fff;"><svg style="width:16px;height:16px">{ICONS['heart']}</svg> Para tu familia</div>
      <h1 style="margin-top:26px;">Que estudiar<br/>no sea<br/><span style="color:{ORANGE};">una batalla</span></h1>
      <p class="sub" style="margin-top:20px;max-width:540px;">Hubzi convierte los apuntes de tu hijo en un juego de niveles — con una capibara que lo acompaña y lo calma.</p>
      <div style="display:flex;gap:12px;margin-top:30px;">
        <span class="chip" style="background:{NAVY};color:{YELLOW};font-size:16px;padding:12px 22px;"><svg style="width:16px;height:16px">{ICONS['check']}</svg> Empieza gratis</span>
        <span class="chip" style="background:#fff;color:{NAVY};box-shadow:0 3px 0 rgba(18,36,67,.15)"><svg style="width:16px;height:16px;color:{GREEN}">{ICONS['shield']}</svg> Pensada para menores</span>
      </div>
    </div>
    <div style="width:340px;height:340px;background:#fff;border-radius:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 0 rgba(18,36,67,.1),0 24px 48px rgba(18,36,67,.12);">
      <img src="{IMG2['escolar_nina']}" style="width:300px;height:300px;object-fit:contain;"/>
    </div>
  </div>
  <p style="position:absolute;bottom:26px;left:0;right:0;text-align:center;font-size:14px;font-weight:700;color:#64748b;letter-spacing:1px;">HUBZI · 2026</p>
</div>
""")

PADRES.append(f"""
<div class="slide" style="background:#f8fafc;padding:64px 72px;">
  <div class="kicker" style="background:{ORANGE};color:#fff;"><svg style="width:16px;height:16px">{ICONS['moon']}</svg> Lo que pasa en casa</div>
  <h2 style="margin-top:24px;">¿Te suena<br/><span style="color:{ORANGE};">esta escena?</span></h2>
  <div style="display:flex;gap:28px;margin-top:52px;flex:1;align-items:center;">
    <div class="card" style="flex:1;display:flex;flex-direction:column;gap:16px;height:280px;justify-content:center;">
      <div class="iconbox" style="background:#fef3c7;"><svg style="color:{ORANGE}">{ICONS['clock']}</svg></div>
      <p style="font-size:19px;font-weight:800;">"Después estudio"</p>
      <p style="font-size:15px;color:#64748b;font-weight:600;">Cada tarde la misma negociación — y el examen cada vez más cerca.</p>
    </div>
    <div class="card" style="flex:1;display:flex;flex-direction:column;gap:16px;height:280px;justify-content:center;">
      <div class="iconbox" style="background:#fee2e2;"><svg style="color:#ef4444">{ICONS['moon']}</svg></div>
      <p style="font-size:19px;font-weight:800;">Los nervios de la noche antes</p>
      <p style="font-size:15px;color:#64748b;font-weight:600;">Llanto, bloqueo o dolor de panza antes de cada prueba importante.</p>
    </div>
    <div class="card" style="flex:1;display:flex;flex-direction:column;gap:16px;height:280px;justify-content:center;">
      <div class="iconbox" style="background:#e0f2fe;"><svg style="color:{BLUE}">{ICONS['game']}</svg></div>
      <p style="font-size:19px;font-weight:800;">Pantallas que no suman</p>
      <p style="font-size:15px;color:#64748b;font-weight:600;">Horas de juego que entretienen… pero no dejan nada.</p>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">02</div>
</div>
""")

PADRES.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#ecfeff,#f0fdf4);padding:64px 72px;align-items:center;text-align:center;">
  <div class="kicker" style="background:{GREEN};color:#fff;"><svg style="width:16px;height:16px">{ICONS['spark']}</svg> Qué es Hubzi</div>
  <h2 style="margin-top:28px;">Sus apuntes se vuelven<br/><span style="color:{GREEN};">un juego</span></h2>
  <p class="sub" style="margin-top:20px;max-width:800px;">Tu hijo sube sus tareas, resúmenes o guías — y en segundos está jugando con preguntas, cartas y niveles sobre <em>su propio</em> material del colegio.</p>
  <div style="display:flex;gap:16px;margin-top:48px;justify-content:center;">
    <span class="chip" style="background:{NAVY};color:#fff;font-size:16px;padding:12px 24px;"><svg style="width:17px;height:17px">{ICONS['infinity']}</svg> Cualquier materia</span>
    <span class="chip" style="background:{GREEN};color:#fff;font-size:16px;padding:12px 24px;"><svg style="width:17px;height:17px">{ICONS['game']}</svg> Juego sin castigo</span>
    <span class="chip" style="background:{CYAN};color:#fff;font-size:16px;padding:12px 24px;"><svg style="width:17px;height:17px">{ICONS['wind']}</svg> Ejercicios de calma</span>
    <span class="chip" style="background:#fff;color:{NAVY};font-size:16px;padding:12px 24px;box-shadow:0 3px 0 rgba(18,36,67,.15)"><svg style="width:17px;height:17px;color:{ORANGE}">{ICONS['shield']}</svg> En su propio espacio</span>
  </div>
  <div style="margin-top:56px;display:flex;justify-content:center;">
    <img src="{IMG2['escolar_nino']}" style="width:200px;height:200px;object-fit:contain;background:#fff;border-radius:28px;padding:10px;box-shadow:0 5px 0 rgba(18,36,67,.09),0 18px 40px rgba(18,36,67,.1);"/>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">03</div>
</div>
""")

PADRES.append(f"""
<div class="slide" style="background:#f8fafc;padding:56px 72px;">
  <div class="kicker" style="background:{GREEN};color:#fff;"><svg style="width:16px;height:16px">{ICONS['game']}</svg> Aprende jugando</div>
  <div style="display:flex;gap:48px;margin-top:24px;flex:1;align-items:center;">
    <div style="flex:1.15;">
      <h2>Sin presión,<br/>con ganas</h2>
      <p class="sub" style="margin-top:14px;">El juego está pensado para que quiera volver — no para que le cueste levantarse.</p>
      <div style="display:flex;flex-direction:column;gap:14px;margin-top:28px;">
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{GREEN};"><svg style="width:24px;height:24px">{ICONS['island']}</svg></div><p style="font-size:17px;font-weight:700;">Cada tema de su material es una isla por conquistar</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{BLUE};"><svg style="width:24px;height:24px">{ICONS['chart']}</svg></div><p style="font-size:17px;font-weight:700;">La dificultad sube solo cuando ya domina</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{YELLOW};"><svg style="width:24px;height:24px">{ICONS['star']}</svg></div><p style="font-size:17px;font-weight:700;">Logros y racha diaria que solo suman</p></div>
      </div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;gap:14px;">
      <div class="card" style="background:{NAVY};color:#fff;padding:26px 28px;">
        <p class="tag" style="color:{YELLOW};">Sin miedo a fallar</p>
        <p style="font-size:24px;font-weight:900;margin-top:8px;line-height:1.35;">Sin vidas. Sin relojes.<br/>Sin "perdiste".</p>
      </div>
      <div class="card" style="padding:20px 26px;display:flex;align-items:center;gap:16px;">
        <div class="iconbox" style="width:52px;height:52px;background:#dcfce7;"><svg style="width:28px;height:28px;color:{GREEN}">{ICONS['check']}</svg></div>
        <p style="font-size:17px;font-weight:700;">Cada error abre una pista — fallar también enseña.</p>
      </div>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">04</div>
</div>
""")

PADRES.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#ecfeff,#f0fdf4);padding:56px 72px;">
  <div class="kicker" style="background:{CYAN};color:#fff;"><svg style="width:16px;height:16px">{ICONS['wind']}</svg> Para los nervios</div>
  <div style="display:flex;gap:44px;margin-top:22px;flex:1;">
    <div style="flex:1.1;">
      <h2>Una pausa<br/><span style="color:{CYAN};">cuando la necesita</span></h2>
      <p class="sub" style="margin-top:12px;">Si tu hijo se pone nervioso, un toque abre ejercicios cortos de calma — las mismas técnicas que usan los psicólogos.</p>
      <div style="display:flex;flex-direction:column;gap:13px;margin-top:24px;">
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{CYAN};"><svg style="width:24px;height:24px">{ICONS['wind']}</svg></div><p style="font-size:16.5px;font-weight:700;">Respiración guiada</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{GREEN};"><svg style="width:24px;height:24px">{ICONS['eye']}</svg></div><p style="font-size:16.5px;font-weight:700;">Ejercicio de los 5 sentidos</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{BLUE};"><svg style="width:24px;height:24px">{ICONS['brain']}</svg></div><p style="font-size:16.5px;font-weight:700;">Para ordenar pensamientos que agobian</p></div>
      </div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;gap:14px;justify-content:center;align-items:center;">
      <div style="width:280px;height:280px;background:#fff;border-radius:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 5px 0 rgba(18,36,67,.09),0 18px 40px rgba(18,36,67,.1);">
        <img src="{IMG2['enfermera']}" style="width:246px;height:246px;object-fit:contain;"/>
      </div>
      <p style="font-size:13px;font-weight:700;color:#64748b;text-align:center;max-width:340px;">Y si tu hijo está muy mal, Hubzi lo nota y muestra dónde pedir ayuda real.</p>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">05</div>
</div>
""")

PADRES.append(f"""
<div class="slide" style="background:#f8fafc;padding:56px 72px;">
  <div class="kicker" style="background:{NAVY};color:#fff;"><svg style="width:16px;height:16px">{ICONS['shield']}</svg> Tu tranquilidad</div>
  <h2 style="margin-top:20px;">Pensada<br/><span style="color:{NAVY};">para menores</span></h2>
  <div style="display:flex;gap:44px;margin-top:30px;flex:1;align-items:center;">
    <div style="flex:1;display:flex;flex-direction:column;gap:14px;">
      <div class="card" style="display:flex;gap:18px;align-items:center;padding:22px 26px;">
        <div class="iconbox" style="width:52px;height:52px;background:{NAVY};"><svg style="width:27px;height:27px">{ICONS['lock']}</svg></div>
        <div><p style="font-size:17.5px;font-weight:800;">Su propio espacio</p><p style="font-size:13.5px;color:#64748b;font-weight:600;">Tu hijo estudia con su material — sin contacto con desconocidos.</p></div>
      </div>
      <div class="card" style="display:flex;gap:18px;align-items:center;padding:22px 26px;">
        <div class="iconbox" style="width:52px;height:52px;background:#059669;"><svg style="width:27px;height:27px">{ICONS['eye']}</svg></div>
        <div><p style="font-size:17.5px;font-weight:800;">Privacidad cuidada</p><p style="font-size:13.5px;color:#64748b;font-weight:600;">Si el colegio la usa, los docentes solo ven avances — jamás conversaciones.</p></div>
      </div>
      <div class="card" style="display:flex;gap:18px;align-items:center;padding:22px 26px;">
        <div class="iconbox" style="width:52px;height:52px;background:{ORANGE};"><svg style="width:27px;height:27px">{ICONS['users']}</svg></div>
        <div><p style="font-size:17.5px;font-weight:800;">Contenido según su edad</p><p style="font-size:13.5px;color:#64748b;font-weight:600;">Las preguntas, el tono y el tiempo de juego se ajustan a su edad.</p></div>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:center;flex:1;">
      <div style="width:300px;height:300px;background:#fff;border-radius:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 5px 0 rgba(18,36,67,.09),0 18px 40px rgba(18,36,67,.1);">
        <img src="{IMG2['medica']}" style="width:264px;height:264px;object-fit:contain;"/>
      </div>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">06</div>
</div>
""")

PADRES.append(edades("07"))

PADRES.append(f"""
<div class="slide" style="background:#f0f9ff;padding:56px 72px;">
  <div class="kicker" style="background:{BLUE};color:#fff;"><svg style="width:16px;height:16px">{ICONS['chart']}</svg> Cuánto cuesta</div>
  <h2 style="margin-top:20px;">Empieza gratis<br/><span style="color:{BLUE};">desde hoy</span></h2>
  <div style="display:flex;gap:20px;margin-top:34px;flex:1;align-items:stretch;">
    <div class="card" style="flex:1;display:flex;flex-direction:column;text-align:center;padding:26px 22px;">
      <p class="tag" style="color:#64748b;">Para empezar</p>
      <p style="margin-top:8px;"><span class="bignum" style="font-size:46px;">$0</span></p>
      <p style="font-size:14px;font-weight:800;margin-top:6px;">Estudiante Zen</p>
      <p style="font-size:13.5px;color:#64748b;font-weight:600;margin-top:10px;">Sube apuntes, juega y usa el modo Zen — gratis para siempre.</p>
      <p style="margin-top:auto;padding-top:14px;font-size:13px;font-weight:800;color:{GREEN};">· Sin tarjeta</p>
    </div>
    <div class="card" style="flex:1;display:flex;flex-direction:column;text-align:center;padding:26px 22px;background:{NAVY};color:#fff;position:relative;">
      <div style="position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,{ORANGE},{YELLOW});color:{NAVY};font-size:11.5px;font-weight:900;letter-spacing:1.5px;padding:6px 18px;border-radius:99px;text-transform:uppercase;">Todo completo</div>
      <p class="tag" style="color:{YELLOW};">Si quiere más</p>
      <p style="margin-top:8px;"><span class="bignum" style="font-size:46px;color:{YELLOW};">$2.99</span><span style="font-size:14px;font-weight:700;color:#cbd5e1;"> /mes</span></p>
      <p style="font-size:14px;font-weight:800;margin-top:6px;">Hubzy Pro</p>
      <p style="font-size:13.5px;color:#cbd5e1;font-weight:600;margin-top:10px;">Material sin límite, los 20 niveles completos y la voz premium de Hubzi.</p>
      <p style="margin-top:auto;padding-top:14px;font-size:13px;font-weight:800;color:{YELLOW};">· Cancela cuando quieras</p>
    </div>
    <div class="card" style="flex:1;display:flex;flex-direction:column;text-align:center;padding:26px 22px;background:linear-gradient(160deg,#065f46,#047857);color:#fff;">
      <p class="tag" style="color:#6ee7b7;">Si el colegio la usa</p>
      <p style="margin-top:8px;"><span class="bignum" style="font-size:46px;color:#6ee7b7;">$1</span><span style="font-size:14px;font-weight:700;color:#d1fae5;"> /est./mes</span></p>
      <p style="font-size:14px;font-weight:800;margin-top:6px;">Hubzy Escuelas</p>
      <p style="font-size:13.5px;color:#d1fae5;font-weight:600;margin-top:10px;">Toda la experiencia con panel para los docentes del colegio.</p>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">08</div>
</div>
""")

PADRES.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#fef3c7,#f0fdf4);align-items:center;justify-content:center;">
  <div class="dot" style="top:-80px;left:-80px;width:280px;height:280px;background:{ORANGE};opacity:.15;"></div>
  <div class="dot" style="bottom:-100px;right:-60px;width:300px;height:300px;background:{GREEN};opacity:.15;"></div>
  <div style="text-align:center;display:flex;flex-direction:column;align-items:center;">
    <div class="kicker" style="background:{ORANGE};color:#fff;"><svg style="width:16px;height:16px">{ICONS['heart']}</svg> Menos peleas</div>
    <h1 style="margin-top:30px;font-size:72px;">Más ganas<br/><span style="color:{ORANGE};">de aprender</span></h1>
    <p class="sub" style="margin-top:22px;max-width:640px;">Estudiar puede ser el juego que tu hijo elija solo — y la calma que necesita antes del examen.</p>
    <div style="width:220px;height:220px;background:#fff;border-radius:32px;display:flex;align-items:center;justify-content:center;margin-top:38px;box-shadow:0 5px 0 rgba(18,36,67,.1),0 18px 40px rgba(18,36,67,.12);">
      <img src="{IMG2['capy3d']}" style="width:190px;height:190px;object-fit:contain;"/>
    </div>
  </div>
  {footer()}
</div>
""")

# ================================================================ ESCRIBIR
def write(name, slides):
    path = os.path.join(OUTDIR, name)
    with open(path, "w", encoding="utf-8") as f:
        f.write(f'<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>Hubzi</title><style>{CSS}</style></head><body>{"".join(slides)}</body></html>')
    print("OK", path)


write("hubzi-aliados.html", ALIADOS)
write("hubzi-jueces.html", JUECES)
write("hubzi-padres.html", PADRES)
