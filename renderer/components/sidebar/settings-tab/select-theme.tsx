import { translationAtom } from "@/atoms/translations-atom";
import { useTheme } from "@/components/theme/use-theme";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAtomValue } from "jotai";
import React, { useEffect } from "react";
import { themeChange } from "theme-change";

const SelectTheme = ({ hideLabel }: { hideLabel?: boolean }) => {
  const availableThemes = [
    // { label: "Upscvayl", value: "upscayl" },
    { label: "light", value: "light" },
    { label: "dark", value: "dark" },
    { label: "claude", value: "claude" },
    { label: "Solar Dusk", value: "solar-dusk" },
    { label: "Solar Dusk (dark)", value: "solar-dusk-dark" },
    // { label: "cupcake", value: "cupcake" },
    // { label: "bumblebee", value: "bumblebee" },
    // { label: "emerald", value: "emerald" },
    // { label: "corporate", value: "corporate" },
    // { label: "synthwave", value: "synthwave" },
    // { label: "retro", value: "retro" },
    // { label: "cyberpunk", value: "cyberpunk" },
    // { label: "valentine", value: "valentine" },
    // { label: "halloween", value: "halloween" },
    // { label: "garden", value: "garden" },
    // { label: "forest", value: "forest" },
    // { label: "aqua", value: "aqua" },
    // { label: "lofi", value: "lofi" },
    // { label: "pastel", value: "pastel" },
    // { label: "fantasy", value: "fantasy" },
    // { label: "wireframe", value: "wireframe" },
    // { label: "black", value: "black" },
    // { label: "luxury", value: "luxury" },
    // { label: "dracula", value: "dracula" },
    // { label: "cmyk", value: "cmyk" },
    // { label: "autumn", value: "autumn" },
    // { label: "business", value: "business" },
    // { label: "acid", value: "acid" },
    // { label: "lemonade", value: "lemonade" },
    // { label: "night", value: "night" },
    // { label: "coffee", value: "coffee" },
    // { label: "winter", value: "winter" },
  ];
  const t = useAtomValue(translationAtom);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    themeChange(false);
  }, []);

  return (
    <div className="flex w-full items-center justify-between">
      {!hideLabel && (
        <p className="text-sm font-medium">{t("SETTINGS.THEME.TITLE")}</p>
      )}
      <Select defaultValue={theme} onValueChange={setTheme}>
        <SelectTrigger className="min-w-50" size="sm">
          <SelectValue placeholder="Select Theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {availableThemes.map((theme) => (
              <SelectItem value={theme.value} key={theme.value}>
                {theme.label.toLocaleUpperCase()}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SelectTheme;
