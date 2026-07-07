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
        <FieldLabel>{t("SETTINGS.RESET_SETTINGS.BUTTON_TITLE")}</FieldLabel>
      )}

      <Button
        className="max-w-50"
        onClick={() => {
          localStorage.clear();
          alert(t("SETTINGS.RESET_SETTINGS.ALERT"));
        }}
      >
        {t("SETTINGS.RESET_SETTINGS.BUTTON_TITLE")}
      </Button>
    </Field>
  );
}
