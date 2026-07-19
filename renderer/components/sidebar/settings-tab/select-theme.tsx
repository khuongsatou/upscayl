import { translationAtom } from "@/atoms/translations-atom";
import { useTheme } from "@/components/theme/use-theme";
import { cn } from "@/lib/utils";
import { useAtomValue } from "jotai";
import { Check } from "lucide-react";
import React, { useEffect } from "react";
import { themeChange } from "theme-change";
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

const ThemePreviewCard = ({
  theme,
  active,
  onSelect,
}: {
  theme: { label: string; value: string };
  active: boolean;
  onSelect: (value: string) => void;
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(theme.value)}
      className="group flex flex-col items-center gap-2 focus:outline-none"
    >
      <div
        className={cn(
          theme.value,
          "relative w-full overflow-hidden rounded-lg border-2 bg-background transition-colors",
          "aspect-[4/3]",
          active
            ? "border-primary"
            : "border-border group-hover:border-foreground/30",
        )}
      >
        {active && (
          <div className="absolute top-1.5 right-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
            <Check
              className="h-2.5 w-2.5 text-primary-foreground"
              strokeWidth={3}
            />
          </div>
        )}

        <div className="flex h-full w-full flex-col">
          {/* top bar: logo mark + wordmark */}
          <div className="flex items-center gap-1 px-2 pt-2 pb-1.5">
            <div className="h-2.5 w-2.5 rounded-[2px] bg-primary" />
            <div className="h-1 w-6 rounded-full bg-foreground/60" />
          </div>

          {/* body: sidebar + content */}
          <div className="flex flex-1 gap-1.5 px-2 pb-2">
            {/* sidebar */}
            <div className="flex flex-col items-center gap-1.5 rounded-sm bg-transparent pt-0.5">
              <div className="h-3 w-3 rounded-[2px] bg-foreground/15" />
              <div className="h-3 w-3 rounded-[2px] bg-accent" />
              <div className="h-3 w-3 rounded-[2px] bg-foreground/15" />
            </div>

            {/* upload panel */}
            <div className="flex flex-1 flex-col gap-1 rounded-[3px] border border-dashed border-border bg-card p-1.5">
              <div className="h-0.5 w-4/5 rounded-full bg-foreground/25" />
              <div className="mt-auto flex flex-1 flex-col items-center justify-center gap-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
                <div className="h-0.5 w-3/5 rounded-full bg-foreground/20" />
              </div>
            </div>

            {/* main canvas */}
            <div className="flex flex-2 flex-col items-center justify-center gap-0.5 rounded-[3px] bg-muted">
              <div className="h-1 w-1/2 rounded-full bg-foreground/40" />
              <div className="h-0.5 w-2/3 rounded-full bg-foreground/20" />
            </div>
          </div>
        </div>
      </div>

      <span
        className={cn(
          "text-xs font-medium",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {theme.label}
      </span>
    </button>
  );
};

const SelectTheme = ({ hideLabel }: { hideLabel?: boolean }) => {
  const t = useAtomValue(translationAtom);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    themeChange(false);
  }, []);

  return (
    <div className="flex w-full flex-col gap-3">
      {!hideLabel && (
        <div>
          <p className="text-sm font-medium">{t("SETTINGS.THEME.TITLE")}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-3">
        {availableThemes.map((t) => (
          <ThemePreviewCard
            key={t.value}
            theme={t}
            active={theme === t.value}
            onSelect={setTheme}
          />
        ))}
      </div>
    </div>
  );
};

export default SelectTheme;
