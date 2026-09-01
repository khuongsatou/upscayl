import { translationAtom } from "@/atoms/translations-atom";
import {
  localMacApiEndpointAtom,
  useLocalMacProcessingAtom,
} from "@/atoms/user-settings-atom";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";

type LocalStatus = "idle" | "checking" | "online" | "offline";

const LocalMacProcessingToggle = () => {
  const [useLocalMacProcessing, setUseLocalMacProcessing] = useAtom(
    useLocalMacProcessingAtom,
  );
  const [localMacApiEndpoint, setLocalMacApiEndpoint] = useAtom(
    localMacApiEndpointAtom,
  );
  const t = useAtomValue(translationAtom);
  const [status, setStatus] = useState<LocalStatus>("idle");

  useEffect(() => {
    if (!useLocalMacProcessing) {
      setStatus("idle");
      return;
    }
    let disposed = false;
    const check = async () => {
      setStatus("checking");
      try {
        const response = await fetch(
          `${localMacApiEndpoint.replace(/\/+$/, "")}/health`,
          { cache: "no-store" },
        );
        if (!disposed) setStatus(response.ok ? "online" : "offline");
      } catch {
        if (!disposed) setStatus("offline");
      }
    };
    void check();
    const timer = window.setInterval(check, 10000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [localMacApiEndpoint, useLocalMacProcessing]);

  const statusLabel =
    status === "online"
      ? "Mac local: Online"
      : status === "offline"
        ? "Mac local: Offline"
        : status === "checking"
          ? "Mac local: Checking..."
          : "Mac local: Tắt";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        {t("SETTINGS.LOCAL_MAC_PROCESSING.TITLE")}
      </p>
      <p className="text-xs text-base-content/80">
        {t("SETTINGS.LOCAL_MAC_PROCESSING.DESCRIPTION")}
      </p>
      <input
        type="checkbox"
        className="toggle"
        checked={useLocalMacProcessing}
        onClick={() => setUseLocalMacProcessing((prev) => !prev)}
      />
      <div className="flex items-center gap-2 text-xs" role="status" aria-live="polite">
        <span
          className={`h-2 w-2 rounded-full ${
            status === "online"
              ? "bg-success"
              : status === "offline"
                ? "bg-error"
                : status === "checking"
                  ? "bg-warning"
                  : "bg-base-content/30"
          }`}
        />
        <span>{statusLabel}</span>
      </div>
      {useLocalMacProcessing && (
        <input
          className="input input-bordered input-sm font-mono text-xs"
          value={localMacApiEndpoint}
          onChange={(event) => setLocalMacApiEndpoint(event.target.value)}
          placeholder="http://127.0.0.1:3047/upscale/api/v1"
        />
      )}
    </div>
  );
};

export default LocalMacProcessingToggle;
