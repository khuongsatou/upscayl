import { ELECTRON_COMMANDS } from "@common/electron-commands";

export const WEB_JOB_CHECKPOINT_STORAGE_KEY =
  "upscayl:web-job-checkpoint:v1";

const WEB_UPSCALE_COMMANDS = [
  ELECTRON_COMMANDS.UPSCAYL,
  ELECTRON_COMMANDS.DOUBLE_UPSCAYL,
  ELECTRON_COMMANDS.FOLDER_UPSCAYL,
] as const;

export type WebUpscaleCommand = (typeof WEB_UPSCALE_COMMANDS)[number];

export type WebJobCheckpoint = {
  version: 1;
  jobId: string;
  command: WebUpscaleCommand;
  createdAt: number;
  expiresAt: number;
};

const isWebUpscaleCommand = (value: unknown): value is WebUpscaleCommand =>
  WEB_UPSCALE_COMMANDS.includes(value as WebUpscaleCommand);

export const parseWebJobCheckpoint = (
  value: unknown,
  now = Date.now(),
): WebJobCheckpoint | null => {
  if (!value || typeof value !== "object") return null;
  const checkpoint = value as Partial<WebJobCheckpoint>;
  if (
    checkpoint.version !== 1 ||
    typeof checkpoint.jobId !== "string" ||
    !/^[0-9a-f-]{20,80}$/i.test(checkpoint.jobId) ||
    !isWebUpscaleCommand(checkpoint.command) ||
    !Number.isFinite(checkpoint.createdAt) ||
    !Number.isFinite(checkpoint.expiresAt) ||
    Number(checkpoint.expiresAt) <= now
  ) {
    return null;
  }
  return checkpoint as WebJobCheckpoint;
};

const browserStorage = () =>
  typeof window === "undefined" ? null : window.localStorage;

export const loadWebJobCheckpoint = (
  storage: Pick<Storage, "getItem" | "removeItem"> | null = browserStorage(),
  now = Date.now(),
) => {
  if (!storage) return null;
  try {
    const raw = storage.getItem(WEB_JOB_CHECKPOINT_STORAGE_KEY);
    if (!raw) return null;
    const checkpoint = parseWebJobCheckpoint(JSON.parse(raw), now);
    if (!checkpoint) storage.removeItem(WEB_JOB_CHECKPOINT_STORAGE_KEY);
    return checkpoint;
  } catch {
    try {
      storage.removeItem(WEB_JOB_CHECKPOINT_STORAGE_KEY);
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
    return null;
  }
};

export const saveWebJobCheckpoint = (
  checkpoint: WebJobCheckpoint,
  storage: Pick<Storage, "setItem"> | null = browserStorage(),
) => {
  if (!storage) return false;
  try {
    storage.setItem(
      WEB_JOB_CHECKPOINT_STORAGE_KEY,
      JSON.stringify(checkpoint),
    );
    return true;
  } catch {
    // The server job still runs if browser storage is unavailable.
    return false;
  }
};

export const clearWebJobCheckpoint = (
  jobId?: string,
  storage: Pick<Storage, "getItem" | "removeItem"> | null = browserStorage(),
) => {
  if (!storage) return;
  try {
    if (jobId) {
      const current = storage.getItem(WEB_JOB_CHECKPOINT_STORAGE_KEY);
      if (current && JSON.parse(current)?.jobId !== jobId) return;
    }
    storage.removeItem(WEB_JOB_CHECKPOINT_STORAGE_KEY);
  } catch {
    try {
      storage.removeItem(WEB_JOB_CHECKPOINT_STORAGE_KEY);
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
  }
};
