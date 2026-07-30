import { translationAtom } from "@/atoms/translations-atom";
import { Button } from "@/components/ui/button";
import { useAtomValue } from "jotai";

type ImageFormatSelectProps = {
  batchMode: boolean;
  saveImageAs: string;
  setExportType: (arg: string) => void;
  hideLabel?: boolean;
};

export function SelectImageFormat({
  batchMode,
  saveImageAs,
  setExportType,
  hideLabel,
}: ImageFormatSelectProps) {
  const t = useAtomValue(translationAtom);

  const renderButtons = (
    <>
      <Button
        variant={saveImageAs === "png" ? "default" : "outline"}
        size="sm"
        onClick={() => setExportType("png")}
      >
        {t("PNG")}
      </Button>

      {/* JPG */}
      <Button
        variant={saveImageAs === "jpg" ? "default" : "outline"}
        size="sm"
        onClick={() => setExportType("jpg")}
      >
        {t("JPG")}
      </Button>

      {/* WEBP */}
      <Button
        variant={saveImageAs === "webp" ? "default" : "outline"}
        size="sm"
        onClick={() => setExportType("webp")}
      >
        {t("WEBP")}
      </Button>
    </>
  );

  if (hideLabel) {
    return <div className="flex flex-wrap gap-1">{renderButtons}</div>;
  }

  return (
    <div className="inline-flex items-center justify-between gap-2">
      <div className="flex flex-row gap-1">
        <p className="text-sm font-medium">
          {t("SAVE IMAGE AS")}
        </p>
        {/* <p className="badge-primary badge text-[10px] font-medium">
          EXPERIMENTAL
        </p> */}
      </div>
      <div className="flex flex-col gap-2">
        {batchMode && <p className="text-base-content/80 text-xs"></p>}
        <div className="flex flex-wrap gap-1">{renderButtons}</div>
      </div>
    </div>
  );
}
