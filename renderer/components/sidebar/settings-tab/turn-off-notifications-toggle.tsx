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
          {t("SETTINGS.TURN_OFF_NOTIFICATIONS.TITLE")}
        </FieldLabel>
        <FieldDescription>
          {t("SETTINGS.TURN_OFF_NOTIFICATIONS.DESCRIPTION")}
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
