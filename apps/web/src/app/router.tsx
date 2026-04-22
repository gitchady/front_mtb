import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Link, Navigate, Outlet, NavLink, useLocation, type RouteObject } from "react-router-dom";
import { motion } from "framer-motion";
import { PLANET_META, type GameCode } from "@mtb/contracts";
import { features } from "@/lib/features";
import { useGameStore } from "@/lib/game-store";
import { MINI_GAME_BY_CODE } from "@/lib/mini-games";
import { isPlanetUnlocked, PLANET_UNLOCK_REQUIREMENTS } from "@/lib/planet-unlocks";

const GalaxyPage = lazy(() => import("@/pages/GalaxyPage").then((module) => ({ default: module.GalaxyPage })));
const GamesPage = lazy(() => import("@/pages/GamesPage").then((module) => ({ default: module.GamesPage })));
const QuestsPage = lazy(() => import("@/pages/QuestsPage").then((module) => ({ default: module.QuestsPage })));
const RewardsPage = lazy(() => import("@/pages/RewardsPage").then((module) => ({ default: module.RewardsPage })));
const ReferralsPage = lazy(() => import("@/pages/ReferralsPage").then((module) => ({ default: module.ReferralsPage })));
const FriendsPage = lazy(() => import("@/pages/FriendsPage").then((module) => ({ default: module.FriendsPage })));
const QrPage = lazy(() => import("@/pages/QrPage").then((module) => ({ default: module.QrPage })));
const AiPage = lazy(() => import("@/pages/AiPage").then((module) => ({ default: module.AiPage })));
const PlanetsMapScreen = lazy(() =>
  import("@/features/planets/screens/PlanetsMapScreen").then((module) => ({ default: module.PlanetsMapScreen })),
);
const PlanetDetailScreen = lazy(() =>
  import("@/features/planets/screens/PlanetDetailScreen").then((module) => ({ default: module.PlanetDetailScreen })),
);
const GameScreen = lazy(() => import("@/features/games/screens/GameScreen").then((module) => ({ default: module.GameScreen })));
const LeaderboardScreen = lazy(() =>
  import("@/features/leaderboard/screens/LeaderboardScreen").then((module) => ({ default: module.LeaderboardScreen })),
);
const SnakePage = lazy(() => import("@/pages/SnakePage").then((module) => ({ default: module.SnakePage })));
const MobyBirdPage = lazy(() => import("@/pages/MobyBirdPage").then((module) => ({ default: module.MobyBirdPage })));
const CashbackTetrisPage = lazy(() =>
  import("@/pages/CashbackTetrisPage").then((module) => ({ default: module.CashbackTetrisPage })),
);
const MobyJumpPage = lazy(() => import("@/pages/MobyJumpPage").then((module) => ({ default: module.MobyJumpPage })));
const FintechMatch3Page = lazy(() =>
  import("@/pages/FintechMatch3Page").then((module) => ({ default: module.FintechMatch3Page })),
);
const SuperMobyBrosPage = lazy(() =>
  import("@/pages/SuperMobyBrosPage").then((module) => ({ default: module.SuperMobyBrosPage })),
);
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

export const appLinks = [
  { to: "/app/galaxy", label: "Обзор" },
  { to: "/app/planets", label: "Планеты" },
  { to: "/app/games", label: "Игры" },
  { to: "/app/leaderboard", label: "Лидерборд" },
  { to: "/app/quests", label: "Квесты" },
  { to: "/app/rewards", label: "Награды" },
  { to: "/app/friends", label: "Друзья" },
  { to: "/app/qr", label: "QR" },
  { to: "/app/ai", label: "AI" },
  { to: "/app/referrals", label: "Социальное кольцо" },
];

const adminLinks = [
  { to: "/admin/kpi", label: "KPI" },
  { to: "/admin/simulator", label: "Симулятор" },
  { to: "/admin/risk", label: "Риски" },
];

function ShellLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[var(--surface)] text-white">
      <div className="galaxy-noise" />
      <div className="mx-auto min-h-screen max-w-[1600px]">
        <header className="top-shell">
          <div className="top-shell__brand">
            <h1>Галактика</h1>
          </div>
          <div className="top-shell__nav-stack">
            <nav className="top-nav" aria-label="Основная навигация">
              {appLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `nav-link ${
                      isActive ||
                      (link.to === "/app/games" && location.pathname.startsWith("/app/game/")) ||
                      (link.to === "/app/planets" && location.pathname.startsWith("/app/planets/"))
                        ? "nav-link-active"
                        : ""
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <p className="top-shell__meta">MTB Bank</p>
          </div>
          <nav className="top-nav top-nav--admin" aria-label="Админка">
            {adminLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative min-h-screen p-5 pt-3 md:p-8 md:pt-4 xl:p-10 xl:pt-5"
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

function GameRouteGuard({ code, children }: { code: GameCode; children: ReactNode }) {
  const game = MINI_GAME_BY_CODE[code];
  const unlockedPlanets = useGameStore((state) => state.unlockedPlanets);

  if (isPlanetUnlocked(unlockedPlanets, game.planetCode)) {
    return <>{children}</>;
  }

  return (
    <section className="surface-panel">
      <p className="eyebrow">{PLANET_META[game.planetCode].title}</p>
      <h2 className="mt-3 text-3xl font-semibold">Игра закрыта</h2>
      <p className="mt-3 max-w-2xl text-sm text-white/60">{PLANET_UNLOCK_REQUIREMENTS[game.planetCode]}</p>
      <Link className="primary-button mt-5 inline-flex" to="/app/games">
        Вернуться к играм
      </Link>
    </section>
  );
}

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <ShellLayout />,
    children: [
      { index: true, element: <Navigate to="/app/galaxy" replace /> },
      { path: "/app/galaxy", element: renderLazy(<GalaxyPage />) },
      { path: "/app/planets", element: renderLazy(<PlanetsMapScreen />) },
      { path: "/app/planets/:planetId", element: renderLazy(<PlanetDetailScreen />) },
      { path: "/app/planets/:planetId/game/:gameCode", element: renderLazy(<GameScreen />) },
      { path: "/app/games", element: renderLazy(<GamesPage />) },
      { path: "/app/leaderboard", element: renderLazy(<LeaderboardScreen />) },
      { path: "/app/quests", element: renderLazy(<QuestsPage />) },
      { path: "/app/rewards", element: renderLazy(<RewardsPage />) },
      { path: "/app/friends", element: renderLazy(<FriendsPage />) },
      { path: "/app/qr", element: renderLazy(<QrPage />) },
      { path: "/app/ai", element: renderLazy(<AiPage />) },
      { path: "/app/referrals", element: renderLazy(<ReferralsPage />) },
      { path: "/app/game/social-ring-signal", element: renderLazy(<GameRouteGuard code="social_ring_signal"><SocialRingGamePage /></GameRouteGuard>) },
      { path: "/app/game/credit-shield-reactor", element: renderLazy(<GameRouteGuard code="credit_shield_reactor"><CreditShieldGamePage /></GameRouteGuard>) },
      { path: "/app/game/moby-bird", element: renderLazy(<GameRouteGuard code="moby_bird"><MobyBirdPage /></GameRouteGuard>) },
      { path: "/app/game/cashback-tetris", element: renderLazy(<GameRouteGuard code="cashback_tetris"><CashbackTetrisPage /></GameRouteGuard>) },
      { path: "/app/game/moby-jump", element: renderLazy(<GameRouteGuard code="moby_jump"><MobyJumpPage /></GameRouteGuard>) },
      { path: "/app/game/fintech-match3", element: renderLazy(<GameRouteGuard code="fintech_match3"><FintechMatch3Page /></GameRouteGuard>) },
      { path: "/app/game/super-moby-bros", element: renderLazy(<GameRouteGuard code="super_moby_bros"><SuperMobyBrosPage /></GameRouteGuard>) },
      {
        path: "/app/game/halva-snake",
        element: features.halvaSnakeEnabled ? (
          renderLazy(<GameRouteGuard code="halva_snake"><SnakePage /></GameRouteGuard>)
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
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes);
}
