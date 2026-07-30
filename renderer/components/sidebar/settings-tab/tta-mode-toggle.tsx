import { translationAtom } from "@/atoms/translations-atom";
import { ttaModeAtom } from "@/atoms/user-settings-atom";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { useAtom, useAtomValue } from "jotai";
import { Switch } from "@/components/ui/switch";

const TTAModeToggle = () => {
  const [ttaMode, setTTAMode] = useAtom(ttaModeAtom);
  const t = useAtomValue(translationAtom);

  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor="tta-mode-switch">
          {t("TTA Mode")}
        </FieldLabel>
        <FieldDescription>
          {t("Enable Test Time Augmentation for better results, such as removing artifacts BUT this will increase the processing time by 8x!")}
        </FieldDescription>
      </FieldContent>

      <Switch
        id="tta-mode-switch"
        checked={ttaMode}
        onCheckedChange={setTTAMode}
      />
    </Field>
  );
};

export default TTAModeToggle;
