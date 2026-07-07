import {
  customWidthAtom,
  useCustomWidthAtom,
} from "@/atoms/user-settings-atom";
import { useAtom, useAtomValue } from "jotai";
import React from "react";
import { translationAtom } from "@/atoms/translations-atom";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function InputCustomResolution() {
  const [useCustomWidth, setUseCustomWidth] = useAtom(useCustomWidthAtom);
  const [customWidth, setCustomWidth] = useAtom(customWidthAtom);
  const t = useAtomValue(translationAtom);

  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel>
          {t("SETTINGS.CUSTOM_INPUT_RESOLUTION.TITLE")} (
          {t("SETTINGS.CUSTOM_INPUT_RESOLUTION.RESTART").toLowerCase()})
        </FieldLabel>
        <FieldDescription className="max-w-11/12">
          {t("SETTINGS.CUSTOM_INPUT_RESOLUTION.DESCRIPTION")}
        </FieldDescription>
      </FieldContent>
      <div className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          className="toggle"
          checked={useCustomWidth}
          onClick={(e) => {
            if (!e.currentTarget.checked) {
              localStorage.removeItem("customWidth");
            }
            setUseCustomWidth(!useCustomWidth);
          }}
        />
        <Input
          type="number"
          value={customWidth}
          disabled={!useCustomWidth}
          onChange={(e) => {
            if (e.currentTarget.value === "") {
              setUseCustomWidth(false);
              setCustomWidth(null);
              localStorage.removeItem("customWidth");
              return;
            }
            setCustomWidth(parseInt(e.currentTarget.value));
          }}
          step="1"
          min="1"
          className="input input-primary h-7 w-32 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>
    </Field>
  );
}
