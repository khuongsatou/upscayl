import React from "react";
import { useAtomValue } from "jotai";
import { translationAtom } from "@/atoms/translations-atom";
import { showSidebarAtom } from "@/atoms/user-settings-atom";
import { ELECTRON_COMMANDS } from "@common/electron-commands";
import useLogger from "../hooks/use-logger";
import { appRuntime, isElectronRuntime } from "@/lib/app-runtime";
import { Square } from "lucide-react";

const formatRemainingTime = (totalSeconds: number) => {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return hours > 0
    ? [hours, minutes, remainingSeconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":")
    : [minutes, remainingSeconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":");
};

function ProgressBar({
  progress,
  doubleUpscaylCounter,
  batchMode,
}: {
  progress: string;
  doubleUpscaylCounter: number;
  batchMode: boolean;
}) {
  const t = useAtomValue(translationAtom);
  const showSidebar = useAtomValue(showSidebarAtom);
  const [estimatedRemainingSeconds, setEstimatedRemainingSeconds] =
    React.useState<number | null>(null);
  const logit = useLogger();
  const numericProgress = Number.parseFloat(progress.replace("%", ""));
  const progressValue = Number.isFinite(numericProgress)
    ? Math.min(100, Math.max(0, numericProgress))
    : undefined;
  const statusText = batchMode
    ? t("APP.PROGRESS_BAR.BATCH_UPSCAYL_IN_PROGRESS_TITLE")
    : t("APP.PROGRESS_BAR.IN_PROGRESS_TITLE");
  const passText =
    isElectronRuntime() && !batchMode && doubleUpscaylCounter > 0
      ? ` · Pass ${doubleUpscaylCounter}`
      : "";
  const remainingTime =
    estimatedRemainingSeconds === null
      ? "--:--"
      : formatRemainingTime(estimatedRemainingSeconds);

  React.useEffect(() => {
    if (isElectronRuntime()) return;

    const etaHandler = (_event: unknown, seconds: number | null) => {
      setEstimatedRemainingSeconds(
        typeof seconds === "number" && Number.isFinite(seconds)
          ? Math.max(0, Math.ceil(seconds))
          : null,
      );
    };

    appRuntime.on(ELECTRON_COMMANDS.WEB_UPSCAYL_ETA, etaHandler);
    return () => {
      appRuntime.off(ELECTRON_COMMANDS.WEB_UPSCAYL_ETA, etaHandler);
    };
  }, []);

  const stopHandler = () => {
    appRuntime.send(ELECTRON_COMMANDS.STOP);
    logit("🛑 Stopping Upscayl");
  };

  return (
    <div
      className={`pointer-events-none fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 ${
        showSidebar ? "md:left-[350px]" : "md:left-0"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-lg border border-base-content/10 bg-base-100/95 px-3 py-2 shadow-xl backdrop-blur">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-3 text-xs">
            <span className="truncate font-medium text-base-content/70">
              {statusText}
              {passText}
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-mono font-semibold tabular-nums text-base-content">
                {progress}
              </span>
              {!isElectronRuntime() && (
                <span className="block whitespace-nowrap text-[10px] font-medium tabular-nums text-base-content/60">
                  {t("APP.PROGRESS_BAR.ETA_LABEL")} {remainingTime}
                </span>
              )}
            </span>
          </div>
          <progress
            className="progress progress-primary block h-2 w-full"
            value={progressValue}
            max="100"
            aria-label={statusText}
          />
        </div>
        <button
          type="button"
          onClick={stopHandler}
          className="btn btn-square btn-ghost btn-sm shrink-0"
          aria-label={t("APP.PROGRESS_BAR.STOP_BUTTON_TITLE")}
          title={t("APP.PROGRESS_BAR.STOP_BUTTON_TITLE")}
        >
          <Square className="h-4 w-4 fill-current" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default ProgressBar;
