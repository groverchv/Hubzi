import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Folder, FolderPlus, Play, Wind, Crown, BookOpen, RefreshCw, LogOut,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import AnimatedCloudsBackground from "../components/AnimatedCloudsBackground";
import capybara3dImg from "../assets/capybara_3d.webp";

function FolderSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl bg-white/60 p-5 h-28 border-b-6 border-slate-200" />
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const [folders, setFolders] = useState(null);
  const [zenStats, setZenStats] = useState(null);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState("free");

  const load = async () => {
    setError(null);
    try {
      const data = await apiFetch("/api/v1/folders");
      setFolders(data?.folders || []);
      if (data?.plan) setPlan(data.plan);
    } catch (e) {
      setError(e.message);
      setFolders([]);
    }
    try {
      const zs = await apiFetch("/api/v1/zen/stats");
      setZenStats(zs);
    } catch {
      setZenStats(null);
    }
  };

  useEffect(() => { load(); }, []);

  const username = user?.username || "Estudiante";
  const isPro = plan === "pro" || user?.plan === "pro";

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100 font-sans">
      <AnimatedCloudsBackground />

      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5">
        <Link to="/" className="flex items-center gap-2">
          <img src={capybara3dImg} alt="Capi" className="w-9 h-9 rounded-xl border-2 border-[#122443] object-cover" />
          <span className="text-xl font-black uppercase text-[#122443]">Hubzy</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/zen" className="rounded-2xl bg-white/70 px-4 py-2 text-xs font-black uppercase text-[#122443] hover:bg-white">
            <Wind className="inline w-4 h-4 mr-1" /> {t("nav.zen")}
          </Link>
          <button
            onClick={logout}
            className="rounded-2xl bg-[#122443] px-4 py-2 text-xs font-black uppercase text-white hover:bg-[#1a335e]"
          >
            <LogOut className="inline w-4 h-4 mr-1" /> {t("nav.logout")}
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-black text-[#122443]">
            {t("dashboard.welcome", { name: username })}
          </h1>
          <p className="mt-1 font-semibold text-slate-600">{t("dashboard.subtitle")}</p>
        </motion.div>

        {/* Quick actions */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Link
            to="/arena"
            className="flex items-center gap-3 rounded-3xl bg-[#FF7A00] p-5 text-white border-b-6 border-[#D45B00] shadow-lg hover:scale-[1.02] transition-transform"
          >
            <Play className="w-8 h-8" />
            <span className="font-black uppercase">{t("dashboard.continue")}</span>
          </Link>
          <Link
            to="/zen"
            className="flex items-center gap-3 rounded-3xl bg-emerald-500 p-5 text-white border-b-6 border-emerald-700 shadow-lg hover:scale-[1.02] transition-transform"
          >
            <Wind className="w-8 h-8" />
            <div>
              <span className="font-black uppercase">{t("zen.title")}</span>
              {zenStats && (
                <p className="text-xs font-bold text-emerald-100">
                  {zenStats.total_sessions} {t("dashboard.zen_sessions").toLowerCase()}
                </p>
              )}
            </div>
          </Link>
          {!isPro ? (
            <Link
              to="/arena?upgrade=1"
              className="flex items-center gap-3 rounded-3xl bg-[#122443] p-5 text-white border-b-6 border-[#050a13] shadow-lg hover:scale-[1.02] transition-transform"
            >
              <Crown className="w-8 h-8 text-[#FFB400]" />
              <div>
                <span className="font-black uppercase">{t("dashboard.upgrade")}</span>
                <p className="text-xs font-bold text-amber-300">{t("dashboard.plan_free")}</p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 rounded-3xl bg-gradient-to-r from-amber-400 to-orange-400 p-5 text-[#122443] border-b-6 border-amber-600 shadow-lg">
              <Crown className="w-8 h-8" />
              <span className="font-black uppercase">{t("dashboard.plan_pro")}</span>
            </div>
          )}
        </div>

        {/* Folders */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase text-[#122443] flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> {t("dashboard.my_folders")}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={load}
                className="rounded-xl bg-white/70 p-2 text-[#122443] hover:bg-white"
                aria-label={t("common.retry")}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <Link
                to="/arena"
                className="inline-flex items-center gap-1 rounded-xl bg-[#122443] px-3 py-2 text-xs font-black uppercase text-white"
              >
                <FolderPlus className="w-4 h-4" /> {t("dashboard.new_folder")}
              </Link>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl bg-rose-100 p-4 text-sm font-semibold text-rose-700">
              {t("common.error")}: {error}
              <button onClick={load} className="ml-3 underline">{t("common.retry")}</button>
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {folders === null ? (
              <>
                <FolderSkeleton /><FolderSkeleton /><FolderSkeleton />
              </>
            ) : folders.length === 0 ? (
              <div className="col-span-full rounded-3xl bg-white/70 p-8 text-center">
                <Folder className="mx-auto w-10 h-10 text-slate-400" />
                <p className="mt-3 font-semibold text-slate-600">{t("dashboard.empty_folders")}</p>
                <Link
                  to="/arena"
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#FF7A00] px-5 py-2.5 text-sm font-black uppercase text-white border-b-4 border-[#D45B00]"
                >
                  <FolderPlus className="w-4 h-4" /> {t("dashboard.new_folder")}
                </Link>
              </div>
            ) : (
              folders.map((f) => (
                <Link
                  key={f.id}
                  to="/arena"
                  state={{ folderId: f.id }}
                  className="group rounded-3xl bg-white/85 p-5 border-b-6 border-slate-200 shadow hover:scale-[1.02] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#FFB400]/20 p-3">
                      <Folder className="w-6 h-6 text-[#FF7A00]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-black text-[#122443]">{f.name}</h3>
                      <p className="text-xs font-semibold text-slate-500">
                        {(f.documents || []).length} docs · {(f.games || []).length} juegos
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
