import { create } from "zustand";

interface SessionState {
  userId: string;
  displayName: string;
  segment: "student" | "first-jobber" | "freelancer";
  syncProfile: (payload: {
    displayName: string;
    segment: "student" | "first-jobber" | "freelancer";
  }) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  userId: "u_demo",
  displayName: "Пилот Моби",
  segment: "student",
  syncProfile: ({ displayName, segment }) =>
    set({
      displayName,
      segment,
    }),
}));
