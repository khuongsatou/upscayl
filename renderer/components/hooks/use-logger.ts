import { logAtom } from "../../atoms/log-atom";
import { useSetAtom } from "jotai";
import { isElectronRuntime } from "@/lib/app-runtime";

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

    const data = [...args].join(" ");
    setLogData((prevLogData) => [...prevLogData, data]);
  };

  return logit;
};

export default useLogger;
