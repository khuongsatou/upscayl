import { atom } from "jotai";

export type SettingsCategory =
  | "appearance"
  | "ai-models"
  | "image-settings"
  | "system"
  | "logs"
  | "help";

export const settingsCategoryAtom = atom<SettingsCategory>("appearance");
