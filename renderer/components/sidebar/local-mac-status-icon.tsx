import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { CircleCheck, CircleOff, CircleX, Loader2 } from "lucide-react";
import {
  localMacApiEndpointAtom,
  useLocalMacProcessingAtom,
} from "@/atoms/user-settings-atom";

type Status = "idle" | "checking" | "online" | "offline";

const LocalMacStatusIcon = () => {
  const enabled = useAtomValue(useLocalMacProcessingAtom);
  const endpoint = useAtomValue(localMacApiEndpointAtom);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }
    let disposed = false;
    const check = async () => {
      setStatus("checking");
      try {
        const response = await fetch(`${endpoint.replace(/\/+$/, "")}/health`, {
          cache: "no-store",
        });
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
  }, [enabled, endpoint]);

  const label =
    status === "online"
      ? "Mac local: Online"
      : status === "offline"
        ? "Mac local: Offline"
        : status === "checking"
          ? "Mac local: Checking..."
          : "Mac local: Tắt";
  const Icon =
    status === "online"
      ? CircleCheck
      : status === "offline"
        ? CircleX
        : status === "checking"
          ? Loader2
          : CircleOff;
  const color =
    status === "online"
      ? "text-success"
      : status === "offline"
        ? "text-error"
        : status === "checking"
          ? "text-warning"
          : "text-base-content/40";

  return (
    <span title={label} aria-label={label} role="img">
      <Icon
        size={16}
        strokeWidth={2.5}
        className={`${color} ${status === "checking" ? "animate-spin" : ""}`}
      />
    </span>
  );
};

export default LocalMacStatusIcon;
