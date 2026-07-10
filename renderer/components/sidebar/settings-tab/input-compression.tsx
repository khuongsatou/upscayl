import { translationAtom } from "@/atoms/translations-atom";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { useAtomValue } from "jotai";

type CompressionInputProps = {
  compression: number;
  handleCompressionChange: (arg: any) => void;
};

export function InputCompression({
  compression,
  handleCompressionChange,
}: CompressionInputProps) {
  const t = useAtomValue(translationAtom);

  return (
    <Field orientation="horizontal">
      <FieldContent className="flex gap-1 text-sm font-medium uppercase">
        <FieldLabel htmlFor="image-compression-slider">
          {t("SETTINGS.IMAGE_COMPRESSION.TITLE", {
            compression: compression.toString(),
          })}
        </FieldLabel>
        {compression > 0 && (
          <FieldDescription className="max-w-11/12 capitalize">
            {t("SETTINGS.IMAGE_COMPRESSION.DESCRIPTION")}
          </FieldDescription>
        )}
      </FieldContent>
      <Slider
        id="image-compression-slider"
        min={0}
        max={100}
        value={[Number(compression)]}
        onValueChange={([value]) => handleCompressionChange(value)}
        className="mt-2 w-full max-w-52"
      />
    </Field>
  );
}
