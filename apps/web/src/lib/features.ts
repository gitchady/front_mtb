export const features = {
  halvaSnakeEnabled: (import.meta.env.VITE_FEATURE_HALVA_SNAKE ?? "true") !== "false",
} as const;

