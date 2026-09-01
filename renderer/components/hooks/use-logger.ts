import { logAtom } from "../../atoms/log-atom";
import { useSetAtom } from "jotai";
import { isElectronRuntime } from "@/lib/app-runtime";
import { LogEntry } from "@/atoms/log-atom";
import { redactLog } from "@/lib/log-utils";

const useLogger = () => {
  const setLogData = useSetAtom(logAtom);

  const logit = (...args: any) => {
    if (isElectronRuntime()) {
      import("electron-log/renderer")
        .then((log) => log.default.log(...args))
        .catch(() => console.log(...args));
    } else {
      console.log(...args);
    }

    const source = isElectronRuntime() ? "electron" : "renderer";
    const raw = [...args].join(" ");
    const entry: LogEntry = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: new Date().toISOString(), source, level: /error|fail|exception|uncaught|🚫/i.test(raw) ? "error" : /warn|warning|⚠️/i.test(raw) ? "warning" : /done|success|complete|🏁|✅/i.test(raw) ? "success" : "info", message: redactLog(raw) };
    setLogData((prevLogData) => [...prevLogData, entry].slice(-500));
  };

  return logit;
};

export default useLogger;
