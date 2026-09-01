import { atomWithStorage } from "jotai/utils";

export type LogLevel = "info" | "success" | "warning" | "error";
export type LogSource = "renderer" | "electron" | "vps" | "local-mac" | "queue" | "app";
export type LogEntry = { id: string; timestamp: string; source: LogSource; level: LogLevel; message: string };
export const logAtom = atomWithStorage<LogEntry[]>("upscayl-log-manager", []);
