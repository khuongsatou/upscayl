import { translationAtom } from "@/atoms/translations-atom";
import { tileSizeAtom } from "@/atoms/user-settings-atom";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldContent,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAtom, useAtomValue } from "jotai";
import React from "react";

export function InputTileSize() {
  const [tileSize, setTileSize] = useAtom(tileSizeAtom);
  const t = useAtomValue(translationAtom);

  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor="custom-tile-size">
          {t("SETTINGS.CUSTOM_TILE_SIZE.TITLE")}
        </FieldLabel>

        <FieldDescription>
          {t("SETTINGS.CUSTOM_TILE_SIZE.DESCRIPTION")}
        </FieldDescription>
      </FieldContent>

      <Input
        id="custom-tile-size"
        type="number"
        value={tileSize ?? ""}
        placeholder="0 = Auto"
        onChange={(e) => {
          if (e.currentTarget.value === "") {
            setTileSize(null);
            localStorage.removeItem("customWidth");
            return;
          }

          setTileSize(Number(e.currentTarget.value));
        }}
        className="max-w-50"
      />
    </Field>
  );
}
