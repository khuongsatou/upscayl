import { translationAtom } from "@/atoms/translations-atom";
import { autoUpdateAtom } from "@/atoms/user-settings-atom";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useAtom, useAtomValue } from "jotai";

const AutoUpdateToggle = () => {
  const [autoUpdate, setAutoUpdate] = useAtom(autoUpdateAtom);
  const t = useAtomValue(translationAtom);

  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor="auto-update-switch">
          {t("SETTINGS.AUTO_UPDATE.TITLE")}
        </FieldLabel>
        <FieldDescription>
          {t("SETTINGS.AUTO_UPDATE.DESCRIPTION")}
        </FieldDescription>
      </FieldContent>

      <Switch
        id="auto-update-switch"
        checked={autoUpdate}
        onCheckedChange={setAutoUpdate}
      />
    </Field>
  );
};

export default AutoUpdateToggle;
