import { translationAtom } from "@/atoms/translations-atom";
import { overwriteAtom } from "@/atoms/user-settings-atom";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useAtom, useAtomValue } from "jotai";

const OverwriteToggle = () => {
  const [overwrite, setOverwrite] = useAtom(overwriteAtom);
  const t = useAtomValue(translationAtom);

  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor="overwrite-previous-upscale-switch">
          {t("OVERWRITE PREVIOUS UPSCALE")}
        </FieldLabel>
        <FieldDescription>
          {t("If enabled, Upscayl will process the image again instead of loading it directly.")}
        </FieldDescription>
      </FieldContent>
      <Switch
        id="overwrite-previous-upscale-switch"
        checked={overwrite}
        onCheckedChange={() => {
          setOverwrite((oldValue: boolean) => {
            if (oldValue) {
              localStorage.removeItem("overwrite");
              return false;
            } else {
              return true;
            }
          });
          localStorage.setItem("overwrite", JSON.stringify(!overwrite));
        }}
      />
    </Field>
  );
};

export default OverwriteToggle;
