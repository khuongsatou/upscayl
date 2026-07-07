import { translationAtom } from "@/atoms/translations-atom";
import { enableContributionAtom } from "@/atoms/user-settings-atom";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useAtom, useAtomValue } from "jotai";

const EnableContributionToggle = () => {
  const [enableContribution, setEnableContribution] = useAtom(
    enableContributionAtom,
  );
  const t = useAtomValue(translationAtom);

  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor="enable-contribution-switch">
          {t("SETTINGS.ENABLE_CONTRIBUTION.TITLE")}
        </FieldLabel>
        <FieldDescription>
          {t("SETTINGS.ENABLE_CONTRIBUTION.DESCRIPTION")}
        </FieldDescription>
      </FieldContent>

      <Switch
        id="enable-contribution-switch"
        checked={enableContribution}
        onCheckedChange={setEnableContribution}
      />
    </Field>
  );
};

export default EnableContributionToggle;
