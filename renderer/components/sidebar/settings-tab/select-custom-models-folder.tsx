import React from "react";
import { ELECTRON_COMMANDS } from "@common/electron-commands";
import { useAtomValue } from "jotai";
import { translationAtom } from "@/atoms/translations-atom";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldContent,
} from "@/components/ui/field";

type CustomModelsFolderSelectProps = {
  customModelsPath: string;
  setCustomModelsPath: (arg: string) => void;
};

export function CustomModelsFolderSelect({
  customModelsPath,
  setCustomModelsPath,
}: CustomModelsFolderSelectProps) {
  const t = useAtomValue(translationAtom);

  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel>{t("SETTINGS.CUSTOM_MODELS.TITLE")}</FieldLabel>

        <FieldDescription>
          {t("SETTINGS.CUSTOM_MODELS.DESCRIPTION")}{" "}
          <a
            href="https://github.com/upscayl/custom-models/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {t("SETTINGS.CUSTOM_MODELS.LINK_TITLE")}
          </a>
          <p className="text-sm text-muted-foreground">{customModelsPath}</p>
        </FieldDescription>
      </FieldContent>

      <Button
        onClick={async () => {
          const customModelPath = await window.electron.invoke(
            ELECTRON_COMMANDS.SELECT_CUSTOM_MODEL_FOLDER,
          );

          if (customModelPath !== null) {
            setCustomModelsPath(customModelPath);
            window.electron.send(
              ELECTRON_COMMANDS.GET_MODELS_LIST,
              customModelPath,
            );
          } else {
            setCustomModelsPath("");
          }
        }}
      >
        {t("SETTINGS.CUSTOM_MODELS.BUTTON_FOLDER")}
      </Button>
    </Field>
  );
}
