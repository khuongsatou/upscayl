import { translationAtom } from "@/atoms/translations-atom";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldContent,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAtomValue } from "jotai";
import React from "react";

type GpuIdInputProps = {
  gpuId: string;
  handleGpuIdChange: React.ChangeEventHandler<HTMLInputElement>;
};

export function InputGpuId({ gpuId, handleGpuIdChange }: GpuIdInputProps) {
  const t = useAtomValue(translationAtom);

  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor="gpu-id-input">
          {t("SETTINGS.GPU_ID_INPUT.TITLE")}
        </FieldLabel>

        <FieldDescription className="space-x-1">
          <span>{t("SETTINGS.GPU_ID_INPUT.DESCRIPTION")}</span>
          <span>{t("SETTINGS.GPU_ID_INPUT.ADDITIONAL_DESCRIPTION")}</span>
        </FieldDescription>
      </FieldContent>

      <Input
        id="gpu-id-input"
        placeholder="Type here"
        value={gpuId}
        onChange={handleGpuIdChange}
        className="max-w-50"
      />
    </Field>
  );
}
