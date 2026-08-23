import { useEffect } from "react";
import { ELECTRON_COMMANDS } from "@common/electron-commands";
import { appRuntime } from "@/lib/app-runtime";

const useElectron = ({
  command,
  func,
}: {
  command: (typeof ELECTRON_COMMANDS)[keyof typeof ELECTRON_COMMANDS];
  func: (...args: any[]) => void;
}) => {
  useEffect(() => {
    appRuntime.on(command, func);
    return () => {
      appRuntime.off(command, func);
    };
  }, []);
};
