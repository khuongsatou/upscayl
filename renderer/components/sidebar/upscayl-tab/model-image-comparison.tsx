import { ReactCompareSlider } from "react-compare-slider";
import { cn } from "@/lib/utils";
import type { ModelImageComparisonProps } from "@/types/model-selection";

const ModelImageComparison = ({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  beforeLabel,
  afterLabel,
  isBeforeUnavailable,
  isAfterUnavailable,
  className,
  onPreviewUnavailable,
}: ModelImageComparisonProps) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <ReactCompareSlider
        changePositionOnHover
        transition="0s"
        className="h-full w-full"
        itemOne={
          <div className="relative h-full w-full">
            {isBeforeUnavailable ? (
              <div className="flex h-full items-center justify-center bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                Before preview unavailable
              </div>
            ) : (
              <img
                src={beforeSrc}
                alt={beforeAlt}
                className="h-full w-full object-cover"
                onError={() => onPreviewUnavailable(beforeSrc)}
              />
            )}
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border bg-background/85 px-2.5 py-1 text-xs font-medium">
              {beforeLabel}
            </div>
          </div>
        }
        itemTwo={
          <div className="relative h-full w-full">
            {isAfterUnavailable ? (
              <div className="flex h-full items-center justify-center bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                After preview unavailable
              </div>
            ) : (
              <img
                src={afterSrc}
                alt={afterAlt}
                className="h-full w-full object-cover"
                onError={() => onPreviewUnavailable(afterSrc)}
              />
            )}
            <div className="pointer-events-none absolute right-3 bottom-3 rounded-full border bg-background/85 px-2.5 py-1 text-xs font-medium">
              {afterLabel}
            </div>
          </div>
        }
      />
    </div>
  );
};

export default ModelImageComparison;
