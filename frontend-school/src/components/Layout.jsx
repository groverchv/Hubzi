import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CreditCard,
  Settings,
  LogOut,
  School,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useSchoolStore } from "../store/schoolStore";

const NAV = [
  { to: "/panel", label: "Panel", icon: LayoutDashboard, roles: ["admin", "teacher"] },
  { to: "/grados", label: "Grados", icon: GraduationCap, roles: ["admin", "teacher"] },
  { to: "/docentes", label: "Docentes", icon: Users, roles: ["admin"] },
  { to: "/licencia", label: "Licencia", icon: CreditCard, roles: ["admin"] },
  { to: "/ajustes", label: "Ajustes", icon: Settings, roles: ["admin"] },
];

export default function Layout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const institution = useSchoolStore((s) => s.institution);
  const role = useSchoolStore((s) => s.role) || user?.role;
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 bg-brand-900 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <School className="w-6 h-6 text-brand-100" />
            <div>
              <div className="font-bold leading-tight">Hubzy Escuelas</div>
              <div className="text-xs text-brand-100/70 truncate max-w-[160px]">
                {institution?.name || "Panel institucional"}
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.filter((n) => n.roles.includes(role)).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-brand-100/80 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <div className="text-xs text-brand-100/70 truncate">{user?.email}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-brand-100 capitalize">{role}</span>
            <button
              onClick={doLogout}
              className="flex items-center gap-1 text-xs text-brand-100/80 hover:text-white cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6">
        <Outlet />
      </main>
    </div>
  );
}
