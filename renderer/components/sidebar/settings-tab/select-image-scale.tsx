import { useEffect, useId, useState } from "react";
import { translationAtom } from "@/atoms/translations-atom";
import { useCustomWidthAtom } from "@/atoms/user-settings-atom";
import {
  IMAGE_SCALE_PRESETS,
  isImageScalePreset,
  isValidImageScale,
} from "@/lib/image-scale";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ImageScaleSelectProps } from "@/types/image-scale";
import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XIcon } from "lucide-react";

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
  const componentId = useId();

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
            {t("Image Scale")}
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
            {t("Custom")}
          </Button>
        </div>
      </div>

      <div className="grid max-w-sm grid-cols-5 rounded-2xl border border-border/60 bg-background p-0.5">
        {IMAGE_SCALE_PRESETS.map((preset) => {
          const isSelected = !showCustomInput && scale === preset;
          const isLargeScale = ["8", "16"].includes(scale);

          return (
            <Button
              type="button"
              variant="ghost"
              key={preset}
              disabled={useCustomWidth}
              aria-pressed={isSelected}
              className="relative rounded-xl hover:bg-background"
              onClick={() => {
                setScale(preset);
                setShowCustomInput(false);
                setCustomScale("");
              }}
            >
              {isSelected && (
                <motion.span
                  layoutId={componentId}
                  className={cn(
                    "absolute inset-0 size-full rounded-xl bg-primary",
                    { "bg-destructive": isLargeScale },
                  )}
                  transition={{
                    type: "spring",
                    stiffness: 700,
                    damping: 40,
                    mass: 0.4,
                  }}
                ></motion.span>
              )}
              <span
                className={cn(
                  "relative z-10 inline-flex items-end font-bold",
                  { "text-destructive-foreground": isLargeScale && isSelected },
                  isSelected && "text-primary-foreground",
                )}
              >
                {preset}
                <XIcon className="mb-[2.5px] size-3" />
              </span>
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
            <Input
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
              className="h-8 w-18 rounded-lg bg-background/70"
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
          {t("Increase image resolution by {scale}×.", { scale })}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t(
            "Anything above 4X (except 16X Double Upscayl) only resizes the image and does not use AI upscaling.",
          )}
        </p>
      )}
      {!hideInfo && Number(scale) >= 6 && (
        <p className="text-xs text-destructive">
          {t("This may cause performance issues on some devices!")}
        </p>
      )}
    </div>
  );
}
