# -*- coding: utf-8 -*-
"""Genera hubzi-presentacion.html — 10 slides, mascotas reales en base64."""
import base64
import os

ASSETS = r"D:\Hack\Proyecto\frontend\src\assets"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hubzi-presentacion.html")


def b64(rel):
    path = os.path.join(ASSETS, rel)
    with open(path, "rb") as f:
        return "data:image/webp;base64," + base64.b64encode(f.read()).decode()


IMG = {
    "escolar": b64("mascots/capy_escolar_nino_m.webp"),
    "psicologo": b64("mascots/capy_psicologo_m.webp"),
    "capy3d": b64("capybara_3d.webp"),
}

NAVY = "#122443"
ORANGE = "#FF7A00"
GREEN = "#48C838"
YELLOW = "#FFB400"
BLUE = "#1C8FE8"
CYAN = "#45B1E8"

CSS = f"""
* {{ margin:0; padding:0; box-sizing:border-box; }}
@page {{ size: 1280px 720px; margin: 0; }}
html,body {{ font-family:'Segoe UI',system-ui,sans-serif; color:{NAVY}; }}
.slide {{ width:1280px; height:720px; page-break-after:always; position:relative;
         overflow:hidden; display:flex; flex-direction:column; }}
.slide:last-child {{ page-break-after:auto; }}
.kicker {{ display:inline-flex; align-items:center; gap:8px; background:{NAVY};
          color:{YELLOW}; font-size:15px; font-weight:800; letter-spacing:2px;
          text-transform:uppercase; padding:8px 20px; border-radius:999px; }}
h1 {{ font-size:64px; font-weight:900; text-transform:uppercase; line-height:1.05; letter-spacing:-1px; }}
h2 {{ font-size:40px; font-weight:900; text-transform:uppercase; line-height:1.1; letter-spacing:-0.5px; }}
.sub {{ font-size:21px; font-weight:600; color:#475569; line-height:1.4; }}
.card {{ background:#fff; border-radius:24px; padding:28px;
        box-shadow:0 4px 0 rgba(18,36,67,.08), 0 12px 32px rgba(18,36,67,.08); }}
.iconbox {{ width:64px; height:64px; border-radius:18px; display:flex; align-items:center;
           justify-content:center; flex-shrink:0; }}
.iconbox svg {{ width:34px; height:34px; }}
.bignum {{ font-size:56px; font-weight:900; line-height:1; }}
.chip {{ display:inline-flex; align-items:center; gap:8px; border-radius:999px;
        padding:8px 16px; font-size:16px; font-weight:700; }}
.pageno {{ position:absolute; bottom:22px; right:34px; font-size:13px; font-weight:700;
          color:#94a3b8; letter-spacing:1px; }}
.brand {{ position:absolute; bottom:18px; left:34px; font-size:14px; font-weight:900;
         letter-spacing:2px; color:#94a3b8; text-transform:uppercase; }}
.tag {{ font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; }}
.dot {{ position:absolute; border-radius:50%; }}
"""

ICONS = {
    "doc": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>',
    "spark": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.7L20 10l-5 3.7L16.6 20 12 16.6 7.4 20 9 13.7 4 10l6.1-1.3z"/></svg>',
    "game": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M7 10v4M5 12h4"/><circle cx="16" cy="10.5" r="1" fill="#fff"/><circle cx="18.5" cy="13.5" r="1" fill="#fff"/></svg>',
    "brain": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a4 4 0 0 0-4 4 4 4 0 0 0-2 7.5V17a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-1.5A4 4 0 0 0 16 8a4 4 0 0 0-4-4z"/><path d="M12 4v16"/></svg>',
    "heart": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    "wind": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M17.7 7.7A2.5 2.5 0 1 1 19.5 12H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>',
    "shield": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    "users": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    "chart": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/></svg>',
    "school": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
    "globe": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    "crown": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-1.5 11h-15z"/></svg>',
    "check": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    "island": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6"/><path d="M12 8a5 5 0 0 1 5 5H7a5 5 0 0 1 5-5z"/><path d="M4 18c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/></svg>',
    "infinity": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.2 8c-2.4 0-4.2 1.6-6.2 4s-3.8 4-6.2 4a4 4 0 1 1 0-8c2.4 0 4.2 1.6 6.2 4s3.8 4 6.2 4a4 4 0 1 0 0-8z"/></svg>',
    "mic": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v5"/></svg>',
    "msg": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    "clock": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    "zap": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    "star": '<svg viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>',
    "lock": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    "rocket": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
    "flask": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>',
    "scale": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M4 7h16"/><path d="M7 7l-3 7a3.5 3.5 0 0 0 6 0z"/><path d="M17 7l-3 7a3.5 3.5 0 0 0 6 0z"/></svg>',
    "book": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    "atom": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="1.5" fill="#fff"/><ellipse cx="12" cy="12" rx="10" ry="4.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)"/></svg>',
    "lang": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>',
    "dna": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3c0 6 16 6 16 12"/><path d="M20 3c0 6-16 6-16 12"/><path d="M6 6h12"/><path d="M6 18h12"/><path d="M4 15c0 3 2 6 4 6"/><path d="M20 15c0 3-2 6-4 6"/></svg>',
    "moon": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>',
    "eye": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    "phone": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.9 2.2z"/></svg>',
    "paw": '<svg viewBox="0 0 24 24" fill="#fff" stroke="none"><circle cx="7" cy="8" r="2.2"/><circle cx="12" cy="6" r="2.2"/><circle cx="17" cy="8" r="2.2"/><path d="M12 11c-3.5 0-6.5 2.7-6.5 5.5 0 1.9 1.6 3.5 3.5 3.5 1.2 0 2-.5 3-.5s1.8.5 3 .5c1.9 0 3.5-1.6 3.5-3.5 0-2.8-3-5.5-6.5-5.5z"/></svg>',
    "smile": '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
}

SLIDES = []

# ---------------------------------------------------------------- 1 · PORTADA
SLIDES.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#e0f2fe 0%,#f0fdf4 55%,#fefce8 100%);align-items:center;justify-content:center;">
  <div class="dot" style="top:-90px;right:-60px;width:280px;height:280px;background:{CYAN};opacity:.18;"></div>
  <div class="dot" style="bottom:-110px;left:-70px;width:320px;height:320px;background:{GREEN};opacity:.15;"></div>
  <div class="dot" style="top:120px;left:90px;width:34px;height:34px;background:{YELLOW};opacity:.55;"></div>
  <div class="dot" style="bottom:140px;right:170px;width:22px;height:22px;background:{ORANGE};opacity:.5;"></div>
  <div class="dot" style="top:180px;right:340px;width:16px;height:16px;background:{GREEN};opacity:.55;"></div>
  <div style="display:flex;align-items:center;gap:64px;position:relative;">
    <div style="text-align:left;max-width:640px;">
      <div class="kicker"><svg style="width:16px;height:16px">{ICONS['spark']}</svg> Tu nueva forma de estudiar</div>
      <h1 style="margin-top:26px;">HUBZI</h1>
      <p style="font-size:30px;font-weight:800;color:{ORANGE};margin-top:8px;">Lo que estudias, convertido en juego</p>
      <p class="sub" style="margin-top:18px;max-width:560px;">Sube tus apuntes y se convierten en niveles, preguntas y desafíos — con una capibara compañera.</p>
      <div style="display:flex;gap:12px;margin-top:30px;">
        <span class="chip" style="background:#fff;color:{NAVY};box-shadow:0 3px 0 rgba(18,36,67,.15)"><svg style="width:16px;height:16px;color:{GREEN}">{ICONS['check']}</svg> Cualquier materia</span>
        <span class="chip" style="background:#fff;color:{NAVY};box-shadow:0 3px 0 rgba(18,36,67,.15)"><svg style="width:16px;height:16px;color:{GREEN}">{ICONS['check']}</svg> Sin presión</span>
        <span class="chip" style="background:#fff;color:{NAVY};box-shadow:0 3px 0 rgba(18,36,67,.15)"><svg style="width:16px;height:16px;color:{GREEN}">{ICONS['check']}</svg> De 4 a 20 años</span>
      </div>
    </div>
    <div style="width:340px;height:340px;background:#fff;border-radius:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 0 rgba(18,36,67,.1),0 24px 48px rgba(18,36,67,.12);">
      <img src="{IMG['escolar']}" style="width:300px;height:300px;object-fit:contain;"/>
    </div>
  </div>
  <p style="position:absolute;bottom:26px;font-size:14px;font-weight:700;color:#64748b;letter-spacing:1px;">HUBZI · 2026</p>
</div>
""")

# ---------------------------------------------------------------- 2 · PROBLEMA
SLIDES.append(f"""
<div class="slide" style="background:#f8fafc;padding:64px 72px;">
  <div class="kicker" style="background:{ORANGE};color:#fff;"><svg style="width:16px;height:16px">{ICONS['zap']}</svg> El problema</div>
  <h2 style="margin-top:24px;">Estudiar no debería<br/><span style="color:{ORANGE};">doler así</span></h2>
  <div style="display:flex;gap:28px;margin-top:52px;flex:1;">
    <div class="card" style="flex:1;display:flex;flex-direction:column;gap:16px;">
      <div class="iconbox" style="background:#fee2e2;"><svg style="color:#ef4444">{ICONS['moon']}</svg></div>
      <p style="font-size:19px;font-weight:800;">Los nervios empiezan temprano</p>
      <p style="font-size:15px;color:#64748b;font-weight:600;">El miedo a los exámenes aparece desde la infancia y la adolescencia — bloqueo, insomnio y ganas de huir.</p>
    </div>
    <div class="card" style="flex:1;display:flex;flex-direction:column;gap:16px;">
      <div class="iconbox" style="background:#e2e8f0;"><svg style="color:#64748b">{ICONS['book']}</svg></div>
      <p style="font-size:19px;font-weight:800;">Leer y releer aburre</p>
      <p style="font-size:15px;color:#64748b;font-weight:600;">Los apuntes quietos no enganchan. Sin motivación, estudiar se posterga hasta la noche anterior.</p>
    </div>
    <div class="card" style="flex:1;display:flex;flex-direction:column;gap:16px;">
      <div class="iconbox" style="background:#fef3c7;"><svg style="color:{ORANGE}">{ICONS['doc']}</svg></div>
      <p style="font-size:19px;font-weight:800;">Las apps traen sus lecciones</p>
      <p style="font-size:15px;color:#64748b;font-weight:600;">Los juegos de estudio de hoy traen contenido propio — el material del alumno queda fuera.</p>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">02</div>
</div>
""")

# ---------------------------------------------------------------- 3 · SOLUCIÓN + PASOS
SLIDES.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#ecfeff,#f0fdf4);padding:64px 72px;align-items:center;text-align:center;">
  <div class="kicker"><svg style="width:16px;height:16px">{ICONS['spark']}</svg> La solución</div>
  <h2 style="margin-top:28px;">Sube tus apuntes.<br/><span style="color:{GREEN};">Juega. Domina.</span></h2>
  <p class="sub" style="margin-top:20px;max-width:780px;">Hubzi toma cualquier documento — un PDF, un Word o una foto de tus resúmenes — y lo convierte en un juego de niveles, listo en segundos.</p>
  <div style="display:flex;align-items:center;gap:18px;margin-top:56px;">
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
      <p style="font-size:14px;color:#64748b;font-weight:600;margin-top:6px;">Nivel tras nivel hasta dominar el tema</p>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">03</div>
</div>
""")

# ---------------------------------------------------------------- 4 · EL JUEGO
SLIDES.append(f"""
<div class="slide" style="background:#f8fafc;padding:56px 72px;">
  <div class="kicker" style="background:{GREEN};color:#fff;"><svg style="width:16px;height:16px">{ICONS['game']}</svg> El juego</div>
  <div style="display:flex;gap:48px;margin-top:24px;flex:1;align-items:center;">
    <div style="flex:1.15;">
      <h2>Un juego, no un examen</h2>
      <p class="sub" style="margin-top:14px;">Cada materia se convierte en un mapa de islas: cada tema de tu documento es una isla con su propia aventura.</p>
      <div style="display:flex;flex-direction:column;gap:14px;margin-top:28px;">
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{GREEN};"><svg style="width:24px;height:24px">{ICONS['island']}</svg></div><p style="font-size:17px;font-weight:700;">Una isla por tema — nunca mezclas capítulos distintos</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{BLUE};"><svg style="width:24px;height:24px">{ICONS['chart']}</svg></div><p style="font-size:17px;font-weight:700;">20 niveles que suben de dificultad poco a poco</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{YELLOW};"><svg style="width:24px;height:24px">{ICONS['spark']}</svg></div><p style="font-size:17px;font-weight:700;">Cartas trampa que se desvanecen cuando aprendes</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{ORANGE};"><svg style="width:24px;height:24px">{ICONS['zap']}</svg></div><p style="font-size:17px;font-weight:700;">Racha de estudio diaria que solo suma</p></div>
      </div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;gap:14px;">
      <div class="card" style="background:{NAVY};color:#fff;padding:26px 28px;">
        <p class="tag" style="color:{YELLOW};">Hecho para no estresar</p>
        <p style="font-size:24px;font-weight:900;margin-top:8px;line-height:1.35;">Sin vidas. Sin relojes.<br/>Sin "perdiste".</p>
      </div>
      <div class="card" style="padding:20px 26px;display:flex;align-items:center;gap:16px;">
        <div class="iconbox" style="width:52px;height:52px;background:#dcfce7;"><svg style="width:28px;height:28px;color:{GREEN}">{ICONS['check']}</svg></div>
        <p style="font-size:17px;font-weight:700;">Equivocarse enseña: cada fallo abre una pista, no un castigo.</p>
      </div>
      <div class="card" style="padding:20px 26px;display:flex;align-items:center;gap:16px;">
        <div class="iconbox" style="width:52px;height:52px;background:#fef3c7;"><svg style="width:28px;height:28px;color:{ORANGE}">{ICONS['smile']}</svg></div>
        <p style="font-size:17px;font-weight:700;">Avanza a tu ritmo: la dificultad se ajusta a lo que dominas.</p>
      </div>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">04</div>
</div>
""")

# ---------------------------------------------------------------- 5 · MATERIAS + EDADES
SLIDES.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#fffbeb,#f0f9ff);padding:48px 72px;">
  <div class="kicker" style="background:{BLUE};color:#fff;"><svg style="width:16px;height:16px">{ICONS['infinity']}</svg> Sin límite de temas ni edades</div>
  <h2 style="margin-top:18px;font-size:36px;">Cualquier materia, de los 4 a los 20</h2>
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-top:30px;">
    <div class="card" style="text-align:center;padding:26px 8px;"><div class="iconbox" style="width:56px;height:56px;background:{ORANGE};margin:0 auto;"><svg style="width:30px;height:30px">{ICONS['flask']}</svg></div><p style="font-size:15.5px;font-weight:800;margin-top:12px;">Matemáticas</p></div>
    <div class="card" style="text-align:center;padding:26px 8px;"><div class="iconbox" style="width:56px;height:56px;background:{BLUE};margin:0 auto;"><svg style="width:30px;height:30px">{ICONS['atom']}</svg></div><p style="font-size:15.5px;font-weight:800;margin-top:12px;">Física y Química</p></div>
    <div class="card" style="text-align:center;padding:26px 8px;"><div class="iconbox" style="width:56px;height:56px;background:{GREEN};margin:0 auto;"><svg style="width:30px;height:30px">{ICONS['dna']}</svg></div><p style="font-size:15.5px;font-weight:800;margin-top:12px;">Biología</p></div>
    <div class="card" style="text-align:center;padding:26px 8px;"><div class="iconbox" style="width:56px;height:56px;background:{CYAN};margin:0 auto;"><svg style="width:30px;height:30px">{ICONS['msg']}</svg></div><p style="font-size:15.5px;font-weight:800;margin-top:12px;">Programación</p></div>
    <div class="card" style="text-align:center;padding:26px 8px;"><div class="iconbox" style="width:56px;height:56px;background:#a855f7;margin:0 auto;"><svg style="width:30px;height:30px">{ICONS['scale']}</svg></div><p style="font-size:15.5px;font-weight:800;margin-top:12px;">Derecho</p></div>
    <div class="card" style="text-align:center;padding:26px 8px;"><div class="iconbox" style="width:56px;height:56px;background:{YELLOW};margin:0 auto;"><svg style="width:30px;height:30px">{ICONS['lang']}</svg></div><p style="font-size:15.5px;font-weight:800;margin-top:12px;">Idiomas y más</p></div>
  </div>
  <p style="font-size:15px;font-weight:700;color:#64748b;margin-top:16px;">Hubzi reconoce de qué trata tu material y adapta las preguntas y explicaciones a esa materia.</p>
  <div style="margin-top:auto;display:flex;align-items:center;gap:18px;margin-bottom:20px;">
    <div style="flex:1;height:2px;background:#cbd5e1;border-radius:99px;"></div>
    <p class="tag" style="color:{BLUE};white-space:nowrap;">El juego se adapta a la edad</p>
    <div style="flex:1;height:2px;background:#cbd5e1;border-radius:99px;"></div>
  </div>
  <div style="display:flex;gap:14px;margin-bottom:6px;">
    <div class="card" style="flex:1;text-align:center;padding:22px 8px;background:#fef3c7;"><p class="bignum" style="font-size:36px;color:{ORANGE};">4-7</p><p style="font-size:15px;font-weight:800;margin-top:5px;">Semillita</p><p style="font-size:12px;color:#78716c;font-weight:600;margin-top:4px;">Se lee todo en voz alta, cero presión</p></div>
    <div class="card" style="flex:1;text-align:center;padding:22px 8px;background:#fef9c3;"><p class="bignum" style="font-size:36px;color:{YELLOW};">8-10</p><p style="font-size:15px;font-weight:800;margin-top:5px;">Explorador</p><p style="font-size:12px;color:#78716c;font-weight:600;margin-top:4px;">Pistas gratis, mapa de mundos</p></div>
    <div class="card" style="flex:1;text-align:center;padding:22px 8px;background:#ecfccb;"><p class="bignum" style="font-size:36px;color:{GREEN};">11-14</p><p style="font-size:15px;font-weight:800;margin-top:5px;">Aventurero</p><p style="font-size:12px;color:#78716c;font-weight:600;margin-top:4px;">Más reto, compañera de equipo</p></div>
    <div class="card" style="flex:1;text-align:center;padding:22px 8px;background:#dcfce7;"><p class="bignum" style="font-size:36px;color:{GREEN};">15-18</p><p style="font-size:15px;font-weight:800;margin-top:5px;">Retador</p><p style="font-size:12px;color:#78716c;font-weight:600;margin-top:4px;">Secundaria y exámenes</p></div>
    <div class="card" style="flex:1;text-align:center;padding:22px 8px;background:#e0f2fe;"><p class="bignum" style="font-size:36px;color:{BLUE};">19+</p><p style="font-size:15px;font-weight:800;margin-top:5px;">Académico</p><p style="font-size:12px;color:#78716c;font-weight:600;margin-top:4px;">Universidad y más allá</p></div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">05</div>
</div>
""")

# ---------------------------------------------------------------- 6 · LA COMPAÑERA
SLIDES.append(f"""
<div class="slide" style="background:#f0fdf4;padding:56px 72px;">
  <div class="kicker" style="background:{GREEN};color:#fff;"><svg style="width:16px;height:16px">{ICONS['paw']}</svg> Tu compañera</div>
  <div style="display:flex;gap:48px;margin-top:22px;flex:1;align-items:center;">
    <div style="width:300px;height:300px;background:#fff;border-radius:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 5px 0 rgba(18,36,67,.09),0 18px 40px rgba(18,36,67,.1);flex-shrink:0;">
      <img src="{IMG['psicologo']}" style="width:264px;height:264px;object-fit:contain;"/>
    </div>
    <div style="flex:1;">
      <h2>Nadie estudia solo</h2>
      <p class="sub" style="margin-top:12px;">Hubzi es una capibara que vive dentro del juego: te habla, celebra tus aciertos y te anima cuando algo te cuesta.</p>
      <div style="display:flex;flex-direction:column;gap:13px;margin-top:26px;">
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{CYAN};"><svg style="width:24px;height:24px">{ICONS['mic']}</svg></div><p style="font-size:17px;font-weight:700;">Te habla con voz mientras juegas</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{GREEN};"><svg style="width:24px;height:24px">{ICONS['star']}</svg></div><p style="font-size:17px;font-weight:700;">Celebra cada logro contigo</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{YELLOW};"><svg style="width:24px;height:24px">{ICONS['msg']}</svg></div><p style="font-size:17px;font-weight:700;">Te da consejos y ánimo cuando fallas</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{ORANGE};"><svg style="width:24px;height:24px">{ICONS['eye']}</svg></div><p style="font-size:17px;font-weight:700;">Nota si estás frustrado y baja el ritmo</p></div>
      </div>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">06</div>
</div>
""")

# ---------------------------------------------------------------- 7 · CALMA + CRISIS
SLIDES.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#ecfeff,#f0fdf4);padding:56px 72px;">
  <div class="kicker" style="background:{CYAN};color:#fff;"><svg style="width:16px;height:16px">{ICONS['wind']}</svg> Modo Zen</div>
  <div style="display:flex;gap:44px;margin-top:22px;flex:1;">
    <div style="flex:1.1;">
      <h2>Cuando los nervios<br/><span style="color:{CYAN};">aprietan</span></h2>
      <p class="sub" style="margin-top:12px;">Un toque y Hubzi guía ejercicios cortos de calma — las mismas técnicas que usan los psicólogos, elegidas por su evidencia científica.</p>
      <div style="display:flex;flex-direction:column;gap:13px;margin-top:24px;">
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{CYAN};"><svg style="width:24px;height:24px">{ICONS['wind']}</svg></div><p style="font-size:16.5px;font-weight:700;">Respiración guiada para bajar el ritmo</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{GREEN};"><svg style="width:24px;height:24px">{ICONS['eye']}</svg></div><p style="font-size:16.5px;font-weight:700;">Ejercicio de los 5 sentidos para volver al presente</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:46px;height:46px;border-radius:14px;background:{BLUE};"><svg style="width:24px;height:24px">{ICONS['brain']}</svg></div><p style="font-size:16.5px;font-weight:700;">Mini-ejercicios para ordenar pensamientos que agobian</p></div>
      </div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;gap:14px;justify-content:center;">
      <div class="card" style="background:#fff1f2;padding:22px 26px;">
        <p class="tag" style="color:#e11d48;">Y si alguien está muy mal</p>
        <p style="font-size:18px;font-weight:800;margin-top:8px;line-height:1.4;">Hubzi lo nota y deja de jugar</p>
        <p style="font-size:14px;color:#64748b;font-weight:600;margin-top:8px;">Detecta señales de crisis y muestra líneas de ayuda y profesionales de la zona.</p>
      </div>
      <div class="card" style="padding:18px 26px;display:flex;align-items:center;gap:16px;">
        <div class="iconbox" style="width:50px;height:50px;background:{NAVY};"><svg style="width:26px;height:26px">{ICONS['shield']}</svg></div>
        <p style="font-size:15.5px;font-weight:700;">Con límites claros: Hubzi no es un psicólogo ni da diagnósticos — y lo dice siempre.</p>
      </div>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">07</div>
</div>
""")

# ---------------------------------------------------------------- 8 · PARA COLEGIOS
SLIDES.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#ecfdf5,#f0fdf4);padding:56px 72px;">
  <div class="kicker" style="background:#059669;color:#fff;"><svg style="width:16px;height:16px">{ICONS['school']}</svg> Para colegios</div>
  <div style="display:flex;gap:44px;margin-top:22px;flex:1;align-items:center;">
    <div style="flex:1;">
      <h2>El aula entera,<br/><span style="color:#059669;">en un mapa</span></h2>
      <p class="sub" style="margin-top:12px;">La escuela organiza cursos y materias. Los estudiantes entran con un simple código de clase — sin correos, sin fricción.</p>
      <div style="display:flex;flex-direction:column;gap:13px;margin-top:24px;">
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:44px;height:44px;border-radius:14px;background:#059669;"><svg style="width:23px;height:23px">{ICONS['users']}</svg></div><p style="font-size:16px;font-weight:700;">Registro por código de clase o lista completa</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:44px;height:44px;border-radius:14px;background:#059669;"><svg style="width:23px;height:23px">{ICONS['book']}</svg></div><p style="font-size:16px;font-weight:700;">El docente asigna materias e islas a cada curso</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:44px;height:44px;border-radius:14px;background:#059669;"><svg style="width:23px;height:23px">{ICONS['doc']}</svg></div><p style="font-size:16px;font-weight:700;">Reportes por estudiante, listos para imprimir</p></div>
        <div style="display:flex;align-items:center;gap:14px;"><div class="iconbox" style="width:44px;height:44px;border-radius:14px;background:#059669;"><svg style="width:23px;height:23px">{ICONS['lock']}</svg></div><p style="font-size:16px;font-weight:700;">Privacidad de menores: solo avances, jamás conversaciones</p></div>
      </div>
    </div>
    <div class="card" style="width:430px;padding:30px;background:#fff;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <p class="tag" style="color:#059669;">Así ve el docente su curso</p>
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
        <p style="font-size:13px;font-weight:700;color:#166534;">El docente ve dónde intervenir antes del examen — no después del reprobado.</p>
      </div>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">08</div>
</div>
""")

# ---------------------------------------------------------------- 9 · PLANES
SLIDES.append(f"""
<div class="slide" style="background:#f8fafc;padding:52px 72px;">
  <div class="kicker" style="background:{YELLOW};color:{NAVY};"><svg style="width:16px;height:16px">{ICONS['crown']}</svg> Los planes</div>
  <h2 style="margin-top:18px;">Gratis para empezar,<br/><span style="color:{ORANGE};">crece contigo</span></h2>
  <div style="display:flex;gap:22px;margin-top:30px;flex:1;align-items:stretch;">
    <div class="card" style="flex:1;display:flex;flex-direction:column;">
      <p class="tag" style="color:#64748b;">Gratis</p>
      <p style="font-size:22px;font-weight:900;margin-top:6px;">Estudiante Zen</p>
      <p style="margin-top:10px;"><span class="bignum" style="font-size:44px;">$0</span></p>
      <p style="font-size:13px;color:#64748b;font-weight:700;">para siempre</p>
      <div style="display:flex;flex-direction:column;gap:9px;margin-top:18px;font-size:14.5px;font-weight:700;color:#334155;">
        <span>· Sube tus apuntes en PDF</span><span>· Juegos de hasta 8 preguntas</span><span>· Modo Zen incluido</span><span>· 7 días de Pro de regalo</span>
      </div>
      <p style="margin-top:auto;padding-top:16px;font-size:13px;color:#94a3b8;font-weight:700;">Para probar sin compromiso</p>
    </div>
    <div class="card" style="flex:1;display:flex;flex-direction:column;background:{NAVY};color:#fff;position:relative;">
      <div style="position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,{ORANGE},{YELLOW});color:{NAVY};font-size:12px;font-weight:900;letter-spacing:1.5px;padding:6px 18px;border-radius:99px;text-transform:uppercase;">Más popular</div>
      <p class="tag" style="color:{YELLOW};">Para estudiantes</p>
      <p style="font-size:22px;font-weight:900;margin-top:6px;">Hubzy Pro</p>
      <p style="margin-top:10px;"><span class="bignum" style="font-size:44px;color:{YELLOW};">$2.99</span><span style="font-size:15px;font-weight:700;color:#cbd5e1;"> al mes</span></p>
      <div style="display:flex;flex-direction:column;gap:9px;margin-top:18px;font-size:14.5px;font-weight:700;color:#e2e8f0;">
        <span>· Material y carpetas sin límite</span><span>· Los 20 niveles completos</span><span>· Voz premium de Hubzi</span><span>· Simulacros sin espera</span>
      </div>
      <p style="margin-top:auto;padding-top:16px;font-size:13px;color:#94a3b8;font-weight:700;">Precio pensado para estudiantes</p>
    </div>
    <div class="card" style="flex:1;display:flex;flex-direction:column;background:linear-gradient(160deg,#065f46,#047857);color:#fff;">
      <p class="tag" style="color:#6ee7b7;">Para instituciones</p>
      <p style="font-size:22px;font-weight:900;margin-top:6px;">Hubzy Escuelas</p>
      <p style="margin-top:10px;"><span class="bignum" style="font-size:44px;color:#6ee7b7;">$1</span><span style="font-size:15px;font-weight:700;color:#d1fae5;"> por estudiante al mes</span></p>
      <p style="font-size:13px;color:#a7f3d0;font-weight:700;">mínimo 30 estudiantes</p>
      <div style="display:flex;flex-direction:column;gap:9px;margin-top:14px;font-size:14.5px;font-weight:700;color:#d1fae5;">
        <span>· Todo lo Pro por estudiante</span><span>· Grados, materias e islas</span><span>· Panel docente y reportes</span>
      </div>
      <p style="margin-top:auto;padding-top:14px;font-size:13px;color:#a7f3d0;font-weight:700;">La escuela paga, el estudiante aprende</p>
    </div>
  </div>
  <div class="brand">Hubzi</div><div class="pageno">09</div>
</div>
""")

# ---------------------------------------------------------------- 10 · CIERRE
SLIDES.append(f"""
<div class="slide" style="background:linear-gradient(160deg,#e0f2fe,#fefce8);align-items:center;justify-content:center;">
  <div class="dot" style="top:-80px;left:-80px;width:280px;height:280px;background:{CYAN};opacity:.18;"></div>
  <div class="dot" style="bottom:-100px;right:-60px;width:300px;height:300px;background:{YELLOW};opacity:.2;"></div>
  <div class="dot" style="top:150px;right:220px;width:24px;height:24px;background:{ORANGE};opacity:.5;"></div>
  <div class="dot" style="bottom:180px;left:280px;width:30px;height:30px;background:{GREEN};opacity:.45;"></div>
  <div style="display:flex;align-items:center;gap:60px;position:relative;">
    <div style="width:330px;height:300px;background:#fff;border-radius:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 0 rgba(18,36,67,.1),0 24px 48px rgba(18,36,67,.12);">
      <img src="{IMG['capy3d']}" style="width:290px;height:290px;object-fit:contain;"/>
    </div>
    <div style="text-align:left;max-width:640px;">
      <div class="kicker"><svg style="width:16px;height:16px">{ICONS['heart']}</svg> Hubzi</div>
      <h2 style="margin-top:22px;font-size:52px;">La forma más humana<br/><span style="color:{ORANGE};">de aprender</span></h2>
      <p class="sub" style="margin-top:18px;">Estudiar cualquier cosa, sin miedo y acompañado. Eso es Hubzi — y ya funciona.</p>
      <div style="display:flex;gap:12px;margin-top:30px;">
        <span class="chip" style="background:{NAVY};color:{YELLOW};font-size:17px;padding:12px 24px;"><svg style="width:17px;height:17px">{ICONS['msg']}</svg> Hablemos</span>
      </div>
    </div>
  </div>
  <p style="position:absolute;bottom:26px;left:0;right:0;text-align:center;font-size:14px;font-weight:700;color:#64748b;letter-spacing:1px;">HUBZI · 2026</p>
  <p style="position:absolute;bottom:8px;left:0;right:0;text-align:center;font-size:10.5px;font-weight:600;color:#94a3b8;letter-spacing:.8px;">Idea de Grover Choque Villca</p>
</div>
""")

html = f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"/>
<title>Hubzi — Presentación</title>
<style>{CSS}</style></head>
<body>{''.join(SLIDES)}</body></html>"""

with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)
print("OK", OUT, len(html), "bytes")
