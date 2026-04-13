import type { PlanetCode } from "@mtb/contracts";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calculateBonusOutcome, type BonusOutcome } from "@/lib/bonus-engine";
import { PLANET_CODE_LABELS, SEGMENT_LABELS } from "@/lib/labels";

export interface ActionLogItem {
  id: string;
  title: string;
  detail: string;
  reward: number;
  planetCode?: PlanetCode;
  createdAt: string;
}

export interface BonusHistoryItem {
  id: string;
  title: string;
  detail: string;
  planetCode: PlanetCode;
  totalReward: number;
  baseReward: number;
  streakBonus: number;
  masteryBonus: number;
  performanceBonus: number;
  focusBonus: number;
  chargeGain: number;
  cratesEarned: number;
  createdAt: string;
}

type StructureMap = Record<PlanetCode, string[]>;
type PlanetMasteryMap = Record<PlanetCode, number>;

interface GameState {
  onboardingComplete: boolean;
  playerAlias: string;
  playerSegment: "student" | "first-jobber" | "freelancer";
  selectedPlanet: PlanetCode;
  stardust: number;
  totalRuns: number;
  bestShieldScore: number;
  bestSocialScore: number;
  bestSnakeScore: number;
  bonusStreak: number;
  vaultCharge: number;
  vaultCrates: number;
  structures: StructureMap;
  planetMastery: PlanetMasteryMap;
  actionLog: ActionLogItem[];
  bonusHistory: BonusHistoryItem[];
  completeOnboarding: (payload: {
    playerAlias: string;
    playerSegment: "student" | "first-jobber" | "freelancer";
    starterPlanet: PlanetCode;
  }) => void;
  selectPlanet: (planetCode: PlanetCode) => void;
  buildStructure: (planetCode: PlanetCode, structureId: string, cost: number, title: string) => boolean;
  claimPlanetAction: (payload: {
    planetCode: PlanetCode;
    title: string;
    detail: string;
    baseReward: number;
  }) => BonusOutcome;
  claimQuestReward: (payload: {
    planetCode: PlanetCode;
    title: string;
    detail: string;
    baseReward: number;
  }) => BonusOutcome;
  recordSnakeRun: (score: number, baseReward: number) => BonusOutcome;
  recordShieldRun: (score: number, baseReward: number) => BonusOutcome;
  recordSocialRun: (score: number, baseReward: number) => BonusOutcome;
  openBonusCrate: () => number | null;
}

const initialStructures: StructureMap = {
  ORBIT_COMMERCE: [],
  CREDIT_SHIELD: [],
  SOCIAL_RING: [],
};

const initialMastery: PlanetMasteryMap = {
  ORBIT_COMMERCE: 0,
  CREDIT_SHIELD: 0,
  SOCIAL_RING: 0,
};

function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function appendActionLog(state: GameState, item: ActionLogItem) {
  return [item, ...state.actionLog].slice(0, 12);
}

function appendBonusHistory(state: GameState, item: BonusHistoryItem) {
  return [item, ...state.bonusHistory].slice(0, 20);
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      onboardingComplete: false,
      playerAlias: "Пилот Моби",
      playerSegment: "student",
      selectedPlanet: "ORBIT_COMMERCE",
      stardust: 24,
      totalRuns: 0,
      bestShieldScore: 0,
      bestSocialScore: 0,
      bestSnakeScore: 0,
      bonusStreak: 0,
      vaultCharge: 16,
      vaultCrates: 0,
      structures: initialStructures,
      planetMastery: initialMastery,
      actionLog: [],
      bonusHistory: [],
      completeOnboarding: ({ playerAlias, playerSegment, starterPlanet }) =>
        set((state) => ({
          onboardingComplete: true,
          playerAlias,
          playerSegment,
          selectedPlanet: starterPlanet,
          stardust: state.stardust + 10,
          actionLog: appendActionLog(state, {
            id: createId(),
            title: "Вход в MTB Galaxy",
            detail: `${playerAlias} стартовал как ${SEGMENT_LABELS[playerSegment].toLowerCase()} и выбрал планету ${PLANET_CODE_LABELS[starterPlanet]}.`,
            reward: 10,
            planetCode: starterPlanet,
            createdAt: new Date().toISOString(),
          }),
        })),
      selectPlanet: (planetCode) => set({ selectedPlanet: planetCode }),
      buildStructure: (planetCode, structureId, cost, title) => {
        const state = get();
        const built = state.structures[planetCode];
        if (built.includes(structureId) || state.stardust < cost) {
          return false;
        }

        set({
          stardust: state.stardust - cost,
          structures: {
            ...state.structures,
            [planetCode]: [...built, structureId],
          },
          actionLog: appendActionLog(state, {
            id: createId(),
            title: `Построено: ${title}`,
            detail: `Строительство завершено на планете ${PLANET_CODE_LABELS[planetCode]}.`,
            reward: -cost,
            planetCode,
            createdAt: new Date().toISOString(),
          }),
        });
        return true;
      },
      claimPlanetAction: ({ planetCode, title, detail, baseReward }) => {
        const state = get();
        const outcome = calculateBonusOutcome(
          {
            bonusStreak: state.bonusStreak,
            vaultCharge: state.vaultCharge,
            selectedPlanet: state.selectedPlanet,
            structures: state.structures,
            planetMastery: state.planetMastery,
          },
          {
            planetCode,
            baseReward,
            category: "planet_action",
          },
        );
        const createdAt = new Date().toISOString();
        set({
          stardust: state.stardust + outcome.totalReward,
          bonusStreak: outcome.nextStreak,
          vaultCharge: outcome.nextVaultCharge,
          vaultCrates: state.vaultCrates + outcome.cratesEarned,
          planetMastery: {
            ...state.planetMastery,
            [planetCode]: outcome.nextMastery,
          },
          actionLog: appendActionLog(state, {
            id: createId(),
            title,
            detail: `${detail}${outcome.cratesEarned ? ` Контейнер хранилища +${outcome.cratesEarned}.` : ""}`,
            reward: outcome.totalReward,
            planetCode,
            createdAt,
          }),
          bonusHistory: appendBonusHistory(state, {
            id: createId(),
            title,
            detail,
            planetCode,
            totalReward: outcome.totalReward,
            baseReward: outcome.baseReward,
            streakBonus: outcome.streakBonus,
            masteryBonus: outcome.masteryBonus,
            performanceBonus: outcome.performanceBonus,
            focusBonus: outcome.focusBonus,
            chargeGain: outcome.chargeGain,
            cratesEarned: outcome.cratesEarned,
            createdAt,
          }),
        });
        return outcome;
      },
      claimQuestReward: ({ planetCode, title, detail, baseReward }) => {
        const state = get();
        const outcome = calculateBonusOutcome(
          {
            bonusStreak: state.bonusStreak,
            vaultCharge: state.vaultCharge,
            selectedPlanet: state.selectedPlanet,
            structures: state.structures,
            planetMastery: state.planetMastery,
          },
          {
            planetCode,
            baseReward,
            category: "quest",
          },
        );
        const createdAt = new Date().toISOString();
        set({
          stardust: state.stardust + outcome.totalReward,
          bonusStreak: outcome.nextStreak,
          vaultCharge: outcome.nextVaultCharge,
          vaultCrates: state.vaultCrates + outcome.cratesEarned,
          planetMastery: {
            ...state.planetMastery,
            [planetCode]: outcome.nextMastery,
          },
          actionLog: appendActionLog(state, {
            id: createId(),
            title,
            detail: `${detail}${outcome.cratesEarned ? ` Контейнер хранилища +${outcome.cratesEarned}.` : ""}`,
            reward: outcome.totalReward,
            planetCode,
            createdAt,
          }),
          bonusHistory: appendBonusHistory(state, {
            id: createId(),
            title,
            detail,
            planetCode,
            totalReward: outcome.totalReward,
            baseReward: outcome.baseReward,
            streakBonus: outcome.streakBonus,
            masteryBonus: outcome.masteryBonus,
            performanceBonus: outcome.performanceBonus,
            focusBonus: outcome.focusBonus,
            chargeGain: outcome.chargeGain,
            cratesEarned: outcome.cratesEarned,
            createdAt,
          }),
        });
        return outcome;
      },
      recordSnakeRun: (score, baseReward) => {
        const state = get();
        const outcome = calculateBonusOutcome(
          {
            bonusStreak: state.bonusStreak,
            vaultCharge: state.vaultCharge,
            selectedPlanet: state.selectedPlanet,
            structures: state.structures,
            planetMastery: state.planetMastery,
          },
          {
            planetCode: "ORBIT_COMMERCE",
            baseReward,
            performanceScore: score,
            category: "mini_game",
          },
        );
        const createdAt = new Date().toISOString();
        set({
          stardust: state.stardust + outcome.totalReward,
          totalRuns: state.totalRuns + 1,
          bestSnakeScore: Math.max(state.bestSnakeScore, score),
          bonusStreak: outcome.nextStreak,
          vaultCharge: outcome.nextVaultCharge,
          vaultCrates: state.vaultCrates + outcome.cratesEarned,
          planetMastery: {
            ...state.planetMastery,
            ORBIT_COMMERCE: outcome.nextMastery,
          },
          actionLog: appendActionLog(state, {
            id: createId(),
            title: "Получена награда Змейки Халва",
            detail: `Забег превращен в орбитальное топливо после ${score} токенов.${outcome.cratesEarned ? ` Контейнер хранилища +${outcome.cratesEarned}.` : ""}`,
            reward: outcome.totalReward,
            planetCode: "ORBIT_COMMERCE",
            createdAt,
          }),
          bonusHistory: appendBonusHistory(state, {
            id: createId(),
            title: "Получена награда Змейки Халва",
            detail: `Собрано орбитальных токенов в Змейке Халва: ${score}.`,
            planetCode: "ORBIT_COMMERCE",
            totalReward: outcome.totalReward,
            baseReward: outcome.baseReward,
            streakBonus: outcome.streakBonus,
            masteryBonus: outcome.masteryBonus,
            performanceBonus: outcome.performanceBonus,
            focusBonus: outcome.focusBonus,
            chargeGain: outcome.chargeGain,
            cratesEarned: outcome.cratesEarned,
            createdAt,
          }),
        });
        return outcome;
      },
      recordShieldRun: (score, baseReward) => {
        const state = get();
        const outcome = calculateBonusOutcome(
          {
            bonusStreak: state.bonusStreak,
            vaultCharge: state.vaultCharge,
            selectedPlanet: state.selectedPlanet,
            structures: state.structures,
            planetMastery: state.planetMastery,
          },
          {
            planetCode: "CREDIT_SHIELD",
            baseReward,
            performanceScore: score,
            category: "mini_game",
          },
        );
        const createdAt = new Date().toISOString();
        set({
          stardust: state.stardust + outcome.totalReward,
          totalRuns: state.totalRuns + 1,
          bestShieldScore: Math.max(state.bestShieldScore, score),
          bonusStreak: outcome.nextStreak,
          vaultCharge: outcome.nextVaultCharge,
          vaultCrates: state.vaultCrates + outcome.cratesEarned,
          planetMastery: {
            ...state.planetMastery,
            CREDIT_SHIELD: outcome.nextMastery,
          },
          actionLog: appendActionLog(state, {
            id: createId(),
            title: "Получена награда Кредитного щита",
            detail: `Управление импульсом стабилизировало щит со счетом ${score}.${outcome.cratesEarned ? ` Контейнер хранилища +${outcome.cratesEarned}.` : ""}`,
            reward: outcome.totalReward,
            planetCode: "CREDIT_SHIELD",
            createdAt,
          }),
          bonusHistory: appendBonusHistory(state, {
            id: createId(),
            title: "Получена награда Кредитного щита",
            detail: `Счет в реакторе щита: ${score}.`,
            planetCode: "CREDIT_SHIELD",
            totalReward: outcome.totalReward,
            baseReward: outcome.baseReward,
            streakBonus: outcome.streakBonus,
            masteryBonus: outcome.masteryBonus,
            performanceBonus: outcome.performanceBonus,
            focusBonus: outcome.focusBonus,
            chargeGain: outcome.chargeGain,
            cratesEarned: outcome.cratesEarned,
            createdAt,
          }),
        });
        return outcome;
      },
      recordSocialRun: (score, baseReward) => {
        const state = get();
        const outcome = calculateBonusOutcome(
          {
            bonusStreak: state.bonusStreak,
            vaultCharge: state.vaultCharge,
            selectedPlanet: state.selectedPlanet,
            structures: state.structures,
            planetMastery: state.planetMastery,
          },
          {
            planetCode: "SOCIAL_RING",
            baseReward,
            performanceScore: score,
            category: "mini_game",
          },
        );
        const createdAt = new Date().toISOString();
        set({
          stardust: state.stardust + outcome.totalReward,
          totalRuns: state.totalRuns + 1,
          bestSocialScore: Math.max(state.bestSocialScore, score),
          bonusStreak: outcome.nextStreak,
          vaultCharge: outcome.nextVaultCharge,
          vaultCrates: state.vaultCrates + outcome.cratesEarned,
          planetMastery: {
            ...state.planetMastery,
            SOCIAL_RING: outcome.nextMastery,
          },
          actionLog: appendActionLog(state, {
            id: createId(),
            title: "Получена награда Социального кольца",
            detail: `Сигнальный ринг синхронизировал команду после ${score} точек импульса.${outcome.cratesEarned ? ` Контейнер хранилища +${outcome.cratesEarned}.` : ""}`,
            reward: outcome.totalReward,
            planetCode: "SOCIAL_RING",
            createdAt,
          }),
          bonusHistory: appendBonusHistory(state, {
            id: createId(),
            title: "Получена награда Социального кольца",
            detail: `Точек импульса в Сигнальном ринге: ${score}.`,
            planetCode: "SOCIAL_RING",
            totalReward: outcome.totalReward,
            baseReward: outcome.baseReward,
            streakBonus: outcome.streakBonus,
            masteryBonus: outcome.masteryBonus,
            performanceBonus: outcome.performanceBonus,
            focusBonus: outcome.focusBonus,
            chargeGain: outcome.chargeGain,
            cratesEarned: outcome.cratesEarned,
            createdAt,
          }),
        });
        return outcome;
      },
      openBonusCrate: () => {
        const state = get();
        if (state.vaultCrates <= 0) {
          return null;
        }
        const reward = 14 + Math.floor(Math.random() * 10);
        const createdAt = new Date().toISOString();
        set({
          stardust: state.stardust + reward,
          vaultCrates: state.vaultCrates - 1,
          actionLog: appendActionLog(state, {
            id: createId(),
            title: "Открыт контейнер хранилища",
            detail: "Мгновенная награда выпущена из бонусного хранилища MTB.",
            reward,
            planetCode: state.selectedPlanet,
            createdAt,
          }),
          bonusHistory: appendBonusHistory(state, {
            id: createId(),
            title: "Открыт контейнер хранилища",
            detail: "Ручное открытие контейнера за накопленный заряд хранилища.",
            planetCode: state.selectedPlanet,
            totalReward: reward,
            baseReward: reward,
            streakBonus: 0,
            masteryBonus: 0,
            performanceBonus: 0,
            focusBonus: 0,
            chargeGain: 0,
            cratesEarned: 0,
            createdAt,
          }),
        });
        return reward;
      },
    }),
    {
      name: "mtb-galaxy-game-v1",
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete,
        playerAlias: state.playerAlias,
        playerSegment: state.playerSegment,
        selectedPlanet: state.selectedPlanet,
        stardust: state.stardust,
        totalRuns: state.totalRuns,
        bestShieldScore: state.bestShieldScore,
        bestSocialScore: state.bestSocialScore,
        bestSnakeScore: state.bestSnakeScore,
        bonusStreak: state.bonusStreak,
        vaultCharge: state.vaultCharge,
        vaultCrates: state.vaultCrates,
        structures: state.structures,
        planetMastery: state.planetMastery,
        actionLog: state.actionLog,
        bonusHistory: state.bonusHistory,
      }),
    },
  ),
);
