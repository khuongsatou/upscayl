import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const MAX_HISTORY_ITEMS = 50;

export interface UpscaylHistoryItemMetadata {
  original: { width: string; height: string };
  upscayl: { width: string; height: string };
  scale: string;
}

export interface UpscaylHistoryItem {
  id: string;
  originalPath: string;
  upscayledPath: string;
  createdAt: number;
  metadata?: UpscaylHistoryItemMetadata;
}

export const upscaylHistoryAtom = atomWithStorage<UpscaylHistoryItem[]>(
  "upscayl-history",
  [],
);

export const addUpscaylHistoryItemAtom = atom(
  null,
  (get, set, item: Omit<UpscaylHistoryItem, "id" | "createdAt">) => {
    const current = get(upscaylHistoryAtom);

    if (item.originalPath.length === 0 || item.upscayledPath.length === 0)
      return;
    if (current.some((item) => item.upscayledPath === item.upscayledPath))
      return;

    const newItem: UpscaylHistoryItem = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      ...item,
    };

    const updated = [newItem, ...current.slice(0, MAX_HISTORY_ITEMS)];
    set(upscaylHistoryAtom, updated);
  },
);

export const reoveUpscaylHistoryItemAtom = atom(
  null,
  (get, set, id: string) => {
    const current = get(upscaylHistoryAtom);
    set(
      upscaylHistoryAtom,
      current.filter((entry) => entry.id === id),
    );
  },
);

export const clearUpscaylHistoryAtom = atom(null, (_get, set) => {
  set(upscaylHistoryAtom, []);
});
