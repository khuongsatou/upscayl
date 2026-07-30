import { translationAtom } from "@/atoms/translations-atom";
import {
  savedOutputPathAtom,
  rememberOutputFolderAtom,
} from "@/atoms/user-settings-atom";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useAtom, useAtomValue } from "jotai";

export function SaveOutputFolderToggle() {
  const [outputPath, setOutputPath] = useAtom(savedOutputPathAtom);
  const [rememberOutputFolder, setRememberOutputFolder] = useAtom(
    rememberOutputFolderAtom,
  );
  const t = useAtomValue(translationAtom);

  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor="save-outputfolder-toggle">
          {t("SAVE OUTPUT FOLDER")}
        </FieldLabel>
        <FieldDescription>
          <span>{t("If enabled, the output folder will be remembered between sessions.")}</span>
          <span>{outputPath}</span>
        </FieldDescription>
      </FieldContent>

      {/* <p className="font-mono text-sm">{outputPath}</p> */}
      <Switch
        id="save-outputfolder-toggle"
        checked={rememberOutputFolder}
        onCheckedChange={() => {
          setRememberOutputFolder((oldValue) => {
            if (oldValue === true) {
              setOutputPath("");
            }
            return !oldValue;
          });
          localStorage.setItem(
            "rememberOutputFolder",
            JSON.stringify(!rememberOutputFolder),
          );
        }}
      />
    </Field>
  );
}
