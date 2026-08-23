import { ELECTRON_COMMANDS } from "@common/electron-commands";
import { useEffect } from "react";
import useLogger from "./use-logger";
import { appRuntime } from "@/lib/app-runtime";

export const initCustomModels = () => {
  const logit = useLogger();

  useEffect(() => {
    const customModelsPath = JSON.parse(
      localStorage.getItem("customModelsPath"),
    );
    if (customModelsPath !== null) {
      appRuntime.send(ELECTRON_COMMANDS.GET_MODELS_LIST, customModelsPath);
      logit("🎯 GET_MODELS_LIST: ", customModelsPath);
    }
  }, []);
};
