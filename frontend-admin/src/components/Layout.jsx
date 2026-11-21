import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, School, Users, CreditCard, Shield, Activity, Crown, LogOut,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

const NAV = [
  { to: "/panel", label: "Panel", icon: LayoutDashboard },
  { to: "/instituciones", label: "Instituciones", icon: School },
  { to: "/usuarios", label: "Usuarios", icon: Users },
  { to: "/suscripciones", label: "Suscripciones", icon: CreditCard },
  { to: "/seguridad", label: "Seguridad", icon: Shield },
  { to: "/sistema", label: "Sistema", icon: Activity },
  { to: "/superadmins", label: "Superadmins", icon: Crown },
];

export default function Layout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 bg-slate-900 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-500" />
            <div>
              <div className="font-bold">Hubzy Admin</div>
              <div className="text-xs text-slate-400">Plataforma</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-white/15 text-white" : "text-slate-300/80 hover:bg-white/10 hover:text-white"}`}>
              <n.icon className="w-4 h-4" />{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <div className="text-xs text-slate-400 truncate">{user?.email}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-brand-500">SUPERADMIN</span>
            <button onClick={() => { logout(); navigate("/login"); }} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6"><Outlet /></main>
    </div>
  );
}
