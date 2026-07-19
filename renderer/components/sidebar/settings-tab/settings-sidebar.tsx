import React from "react";
import { useAtom } from "jotai";
import { useAtomValue } from "jotai";
import {
  Palette,
  Cpu,
  Image as ImageIcon,
  MonitorCog,
  ScrollText,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  settingsCategoryAtom,
  SettingsCategory,
} from "@/atoms/settings-category-atom";
import { translationAtom } from "@/atoms/translations-atom";

interface NavItem {
  id: SettingsCategory;
  label: string;
  icon: React.ElementType;
}

function SettingsSidebar() {
  const [activeCategory, setActiveCategory] = useAtom(settingsCategoryAtom);
  const t = useAtomValue(translationAtom);

  // Swap the hardcoded labels below for t("SETTINGS.NAV....") once the
  // corresponding keys exist in your translation files.
  const navItems: NavItem[] = [
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "ai-models", label: "AI Models", icon: Cpu },
    { id: "image-settings", label: "Image Settings", icon: ImageIcon },
    { id: "system", label: "System", icon: MonitorCog },
    { id: "logs", label: "Logs", icon: ScrollText },
    { id: "help", label: "Help", icon: HelpCircle },
  ];

  return (
    <nav className="flex h-full w-48 shrink-0 flex-col gap-1 border-r pr-3">
      {navItems.map(({ id, label, icon: Icon }) => {
        const isActive = activeCategory === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActiveCategory(id)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default SettingsSidebar;
