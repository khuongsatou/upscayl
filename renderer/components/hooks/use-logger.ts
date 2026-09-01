import { logAtom } from "../../atoms/log-atom";
import { useSetAtom } from "jotai";
import { isElectronRuntime } from "@/lib/app-runtime";

const useLogger = () => {
  const setLogData = useSetAtom(logAtom);

  const redact = (value: string) =>
    value
      .replace(/(x-api-key|authorization|token|secret|password)\s*[:=]\s*[^\s,]+/gi, "$1: [REDACTED]")
      .replace(/(bbmcp_|up_)[A-Za-z0-9_-]+/g, "[REDACTED]");

  const logit = (...args: any) => {
    if (isElectronRuntime()) {
      import("electron-log/renderer")
        .then((log) => log.default.log(...args))
        .catch(() => console.log(...args));
    } else {
      console.log(...args);
    }

    const data = redact([...args].join(" "));
    setLogData((prevLogData) => [...prevLogData, data].slice(-500));
  };

  return logit;
};

export default useLogger;
