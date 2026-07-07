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
          {t("SETTINGS.TTA_MODE.TITLE")}
        </FieldLabel>
        <FieldDescription>
          {t("SETTINGS.TTA_MODE.DESCRIPTION")}
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
