import type { PlanetCode } from "@mtb/contracts";

export type GameActionKind = "partner" | "nonPartner" | "credit" | "referral" | "education" | "risky";

export interface PlanetAction {
  id: string;
  title: string;
  detail: string;
  eventKind: GameActionKind;
  stardustReward: number;
}

export interface PlanetStructure {
  id: string;
  title: string;
  detail: string;
  cost: number;
}

export interface StagePlanetConfig {
  top: string;
  left: string;
  size: number;
  hue: string;
}

export const PLANET_BACKGROUNDS: Record<PlanetCode, string> = {
  ORBIT_COMMERCE: "linear-gradient(135deg, #f44d89 0%, #6c52ff 100%)",
  CREDIT_SHIELD: "linear-gradient(135deg, #50d0ff 0%, #2e5bff 100%)",
  SOCIAL_RING: "linear-gradient(135deg, #9dfc5b 0%, #14b86a 100%)",
};

export const PLANET_STAGE: Record<PlanetCode, StagePlanetConfig> = {
  ORBIT_COMMERCE: {
    top: "14%",
    left: "10%",
    size: 172,
    hue: PLANET_BACKGROUNDS.ORBIT_COMMERCE,
  },
  CREDIT_SHIELD: {
    top: "52%",
    left: "58%",
    size: 156,
    hue: PLANET_BACKGROUNDS.CREDIT_SHIELD,
  },
  SOCIAL_RING: {
    top: "18%",
    left: "68%",
    size: 132,
    hue: PLANET_BACKGROUNDS.SOCIAL_RING,
  },
};

export const PLANET_ACTIONS: Record<PlanetCode, PlanetAction[]> = {
  ORBIT_COMMERCE: [
    {
      id: "orbit_partner",
      title: "Оплатить покупку у партнера",
      detail: "Фиксирует оплату у партнера банка и усиливает прогресс в Орбите покупок",
      eventKind: "partner",
      stardustReward: 6,
    },
    {
      id: "orbit_open",
      title: "Оплатить обычную покупку картой",
      detail: "Учитывает повседневную оплату картой и поддерживает базовый ритм активности",
      eventKind: "nonPartner",
      stardustReward: 3,
    },
  ],
  CREDIT_SHIELD: [
    {
      id: "shield_payment",
      title: "Внести платеж вовремя",
      detail: "Засчитывает своевременный платеж и укрепляет устойчивость в Кредитном щите",
      eventKind: "credit",
      stardustReward: 7,
    },
    {
      id: "shield_learning",
      title: "Проверить кредитный лимит",
      detail: "Отмечает интерес к кредитному продукту и помогает двигаться по безопасной траектории",
      eventKind: "education",
      stardustReward: 4,
    },
  ],
  SOCIAL_RING: [
    {
      id: "social_referral",
      title: "Пригласить друга",
      detail: "Добавляет нового участника в социальный контур и усиливает рост Социального кольца",
      eventKind: "referral",
      stardustReward: 8,
    },
    {
      id: "social_stress",
      title: "Отправить перевод по номеру",
      detail: "Фиксирует быстрый перевод по номеру телефона и поддерживает живую социальную активность",
      eventKind: "risky",
      stardustReward: 2,
    },
  ],
};

export const PLANET_STRUCTURES: Record<PlanetCode, PlanetStructure[]> = {
  ORBIT_COMMERCE: [
    {
      id: "merchant-relay",
      title: "Партнерский ретранслятор",
      detail: "Укрепляет партнерскую гравитацию и усиливает визуальную линию Орбиты покупок",
      cost: 12,
    },
    {
      id: "cashback-port",
      title: "Импульс-порт",
      detail: "Превращает короткие всплески активности в более сильные окна усиления",
      cost: 18,
    },
    {
      id: "mission-hub",
      title: "Командный узел",
      detail: "Расширяет ежедневный ритм партнерских спринтов и импульсов категорий",
      cost: 22,
    },
  ],
  CREDIT_SHIELD: [
    {
      id: "discipline-array",
      title: "Массив дисциплины",
      detail: "Стабилизирует ритм платежей и показывает рост доверия",
      cost: 14,
    },
    {
      id: "trust-vault",
      title: "Хранилище доверия",
      detail: "Подсвечивает чистое поведение и открывает рост доступа в игровой логике",
      cost: 19,
    },
    {
      id: "learning-node",
      title: "Учебный узел",
      detail: "Связывает учебные модули и безопасный доступ в одну линию улучшений",
      cost: 16,
    },
  ],
  SOCIAL_RING: [
    {
      id: "squad-dock",
      title: "Док команды",
      detail: "Добавляет видимую емкость команды и делает рефералы общим достижением",
      cost: 10,
    },
    {
      id: "ally-lens",
      title: "Линза союзников",
      detail: "Улучшает видимость рефералов и добавляет турнирный социальный слой",
      cost: 17,
    },
    {
      id: "guild-gate",
      title: "Врата гильдии",
      detail: "Превращает кольцо в статусный объект для лучших пилотов",
      cost: 24,
    },
  ],
};
