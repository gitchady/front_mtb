import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate, Outlet, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { features } from "@/lib/features";

const GalaxyPage = lazy(() => import("@/pages/GalaxyPage").then((module) => ({ default: module.GalaxyPage })));
const QuestsPage = lazy(() => import("@/pages/QuestsPage").then((module) => ({ default: module.QuestsPage })));
const RewardsPage = lazy(() => import("@/pages/RewardsPage").then((module) => ({ default: module.RewardsPage })));
const ReferralsPage = lazy(() => import("@/pages/ReferralsPage").then((module) => ({ default: module.ReferralsPage })));
const SnakePage = lazy(() => import("@/pages/SnakePage").then((module) => ({ default: module.SnakePage })));
const CreditShieldGamePage = lazy(() =>
  import("@/pages/CreditShieldGamePage").then((module) => ({ default: module.CreditShieldGamePage })),
);
const SocialRingGamePage = lazy(() =>
  import("@/pages/SocialRingGamePage").then((module) => ({ default: module.SocialRingGamePage })),
);
const AdminKpiPage = lazy(() => import("@/pages/AdminKpiPage").then((module) => ({ default: module.AdminKpiPage })));
const AdminSimulatorPage = lazy(() =>
  import("@/pages/AdminSimulatorPage").then((module) => ({ default: module.AdminSimulatorPage })),
);
const AdminRiskPage = lazy(() => import("@/pages/AdminRiskPage").then((module) => ({ default: module.AdminRiskPage })));
const FeatureLockedPage = lazy(() =>
  import("@/pages/FeatureLockedPage").then((module) => ({ default: module.FeatureLockedPage })),
);

const appLinks = [
  { to: "/app/galaxy", label: "Галактика" },
  { to: "/app/quests", label: "Квесты" },
  { to: "/app/rewards", label: "Награды" },
  { to: "/app/referrals", label: "Социальное кольцо" },
  { to: "/app/game/social-ring-signal", label: "Сигнальный ринг" },
  { to: "/app/game/credit-shield-reactor", label: "Реактор щита" },
  ...(features.halvaSnakeEnabled ? [{ to: "/app/game/halva-snake", label: "Змейка Халва" }] : []),
];

const adminLinks = [
  { to: "/admin/kpi", label: "KPI" },
  { to: "/admin/simulator", label: "Симулятор" },
  { to: "/admin/risk", label: "Риски" },
];

function ShellLayout() {
  return (
    <div className="min-h-screen bg-[var(--surface)] text-white">
      <div className="galaxy-noise" />
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-black/30 p-6 backdrop-blur-xl lg:border-b-0 lg:border-r">
          <div className="mb-10 space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">MTB Bank</p>
            <h1 className="text-4xl font-semibold leading-none">Галактика</h1>
            <p className="max-w-[18rem] text-sm text-white/70">
              Игровое ядро лояльности для покупок, рассрочки и рекомендаций.
            </p>
          </div>
          <nav className="space-y-8">
            <section>
              <p className="mb-3 text-xs uppercase tracking-[0.35em] text-white/40">Клиент</p>
              <div className="space-y-2">
                {appLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "nav-link-active" : ""}`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </section>
            <section>
              <p className="mb-3 text-xs uppercase tracking-[0.35em] text-white/40">Админка</p>
              <div className="space-y-2">
                {adminLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "nav-link-active" : ""}`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </section>
          </nav>
        </aside>
        <main className="relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative min-h-screen p-5 md:p-8 xl:p-10"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function PageFallback() {
  return (
    <div className="surface-panel">
      <p className="eyebrow">Загрузка маршрута</p>
      <h2 className="mt-3 text-3xl font-semibold">Переходим в следующий сектор…</h2>
      <p className="mt-3 text-sm text-white/60">Экран загружается отдельным чанком, чтобы первый вход был легче.</p>
    </div>
  );
}

function renderLazy(element: ReactNode) {
  return <Suspense fallback={<PageFallback />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ShellLayout />,
    children: [
      { index: true, element: <Navigate to="/app/galaxy" replace /> },
      { path: "/app/galaxy", element: renderLazy(<GalaxyPage />) },
      { path: "/app/quests", element: renderLazy(<QuestsPage />) },
      { path: "/app/rewards", element: renderLazy(<RewardsPage />) },
      { path: "/app/referrals", element: renderLazy(<ReferralsPage />) },
      { path: "/app/game/social-ring-signal", element: renderLazy(<SocialRingGamePage />) },
      { path: "/app/game/credit-shield-reactor", element: renderLazy(<CreditShieldGamePage />) },
      {
        path: "/app/game/halva-snake",
        element: features.halvaSnakeEnabled ? (
          renderLazy(<SnakePage />)
        ) : (
          renderLazy(<FeatureLockedPage
            title="Змейка Халва временно отключена"
            description="Мини-игра находится за фича-флагом, поэтому ее можно отключить без влияния на банковский сценарий и админ-демо."
          />)
        ),
      },
      { path: "/admin/kpi", element: renderLazy(<AdminKpiPage />) },
      { path: "/admin/simulator", element: renderLazy(<AdminSimulatorPage />) },
      { path: "/admin/risk", element: renderLazy(<AdminRiskPage />) },
    ],
  },
]);
