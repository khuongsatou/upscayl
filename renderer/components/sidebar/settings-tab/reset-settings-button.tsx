import { translationAtom } from "@/atoms/translations-atom";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { useAtomValue } from "jotai";
import React from "react";

export function ResetSettingsButton({
  hideLabel = false,
}: {
  hideLabel?: boolean;
}) {
  const t = useAtomValue(translationAtom);
  return (
    <Field orientation="horizontal">
      {!hideLabel && (
        <FieldLabel>{t("RESET UPSCAYL")}</FieldLabel>
      )}

      <Button
        className="max-w-50"
        onClick={() => {
          localStorage.clear();
          alert(t("Upscayl has been reset. Please restart the app."));
        }}
      >
        {t("RESET UPSCAYL")}
      </Button>
    </Field>
  );
}
