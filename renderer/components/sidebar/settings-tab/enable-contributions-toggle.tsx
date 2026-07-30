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
          {t("HELP IMPROVE UPSCAYL")}
        </FieldLabel>
        <FieldDescription>
          {t("If enabled, Upscayl will collect anonymous usage data to improve the application interface and features.")}
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
