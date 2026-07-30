import { translationAtom } from "@/atoms/translations-atom";
import { turnOffNotificationsAtom } from "@/atoms/user-settings-atom";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useAtom, useAtomValue } from "jotai";

const TurnOffNotificationsToggle = () => {
  const [turnOffNotifications, setTurnOffNotifications] = useAtom(
    turnOffNotificationsAtom,
  );
  const t = useAtomValue(translationAtom);

  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor="turn-off-notifications-switch">
          {t("TURN OFF NOTIFICATIONS")}
        </FieldLabel>
        <FieldDescription>
          {t("If enabled, Upscayl will not send any system notifications on success or failure.")}
        </FieldDescription>
      </FieldContent>

      <Switch
        id="turn-off-notifications-switch"
        checked={turnOffNotifications}
        onCheckedChange={setTurnOffNotifications}
      />
    </Field>
  );
};

export default TurnOffNotificationsToggle;
