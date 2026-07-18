import { useEffect, useState } from "react";
import { translationAtom } from "@/atoms/translations-atom";
import { useCustomWidthAtom } from "@/atoms/user-settings-atom";
import {
  IMAGE_SCALE_PRESETS,
  isImageScalePreset,
  isValidImageScale,
} from "@/lib/image-scale";
import { cn } from "@/lib/utils";
import type { ImageScaleSelectProps } from "@/types/image-scale";
import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";

export function SelectImageScale({
  scale,
  setScale,
  hideInfo,
}: ImageScaleSelectProps) {
  const useCustomWidth = useAtomValue(useCustomWidthAtom);
  const t = useAtomValue(translationAtom);
  const [showCustomInput, setShowCustomInput] = useState(
    !isImageScalePreset(scale),
  );
  const [customScale, setCustomScale] = useState(
    isImageScalePreset(scale) ? "" : scale,
  );
  const hasValidCustomScale = isValidImageScale(customScale);

  useEffect(() => {
    const isCustomScale = !isImageScalePreset(scale);

    setShowCustomInput(isCustomScale);
    setCustomScale(isCustomScale ? scale : "");
  }, [scale]);

  return (
    <div className={cn("mt-2 space-y-2", useCustomWidth && "opacity-50")}>
      <div className="flex items-center justify-between gap-2">
        <div className="step-heading flex flex-row text-sm">
          <span className="w-fit rounded-lg bg-foreground/10 px-2 text-sm font-medium">
            {t("SETTINGS.IMAGE_SCALE.TITLE")}
            {!hideInfo && useCustomWidth && " DISABLED"} -
            <span className="text-sm font-medium text-muted-foreground">
              {" "}
              {scale}×
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={useCustomWidth}
            aria-expanded={showCustomInput}
            aria-controls="custom-image-scale"
            onClick={() => {
              setShowCustomInput(true);
              setCustomScale(isImageScalePreset(scale) ? "" : scale);
            }}
          >
            Custom
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {IMAGE_SCALE_PRESETS.map((preset) => {
          const isSelected = !showCustomInput && scale === preset;

          return (
            <Button
              type="button"
              key={preset}
              variant={isSelected ? "default" : "outline"}
              size="lg"
              disabled={useCustomWidth}
              aria-pressed={isSelected}
              onClick={() => {
                setScale(preset);
                setShowCustomInput(false);
                setCustomScale("");
              }}
            >
              {preset}×
            </Button>
          );
        })}
      </div>

      {showCustomInput && (
        <div className="flex flex-wrap items-center gap-2">
          <label
            className="text-xs text-muted-foreground"
            htmlFor="custom-image-scale"
          >
            Custom scale
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="custom-image-scale"
              type="number"
              min="1"
              max="16"
              step="1"
              inputMode="numeric"
              value={customScale}
              disabled={useCustomWidth}
              aria-invalid={customScale.length > 0 && !hasValidCustomScale}
              placeholder="1–16"
              className="h-8 w-18 rounded-lg border bg-background/70 px-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none"
              onChange={(event) => {
                const value = event.target.value;
                if (value !== "" && !/^\d{1,2}$/.test(value)) return;

                setCustomScale(value);
              }}
              onBlur={() => {
                if (hasValidCustomScale) {
                  setScale(customScale);
                  return;
                }

                setCustomScale(isImageScalePreset(scale) ? "" : scale);
              }}
            />
            <span className="text-sm text-muted-foreground">×</span>
          </div>
          {customScale.length > 0 && !hasValidCustomScale && (
            <p className="basis-full text-xs text-destructive">
              Enter a whole number from 1 to 16.
            </p>
          )}
        </div>
      )}

      {hideInfo ? (
        <p className="text-xs text-muted-foreground">
          Increase image resolution by {scale}×.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("SETTINGS.IMAGE_SCALE.DESCRIPTION")}
        </p>
      )}
      {!hideInfo && Number(scale) >= 6 && (
        <p className="text-xs text-destructive">
          {t("SETTINGS.IMAGE_SCALE.ADDITIONAL_WARNING")}
        </p>
      )}
    </div>
  );
}
