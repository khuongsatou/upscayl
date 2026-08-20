import { cn } from "@/lib/utils";
import { HomeIcon, ImageOffIcon, LucideIcon, SettingsIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useSetAtom } from "jotai";
import { showSettingsDialogAtom } from "@/atoms/toggle-settings";

export type AppTab = "home" | "remove-background";

const Sidenav = ({
  activeTab,
  onTabChange,
}: {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}) => {
  const setShowSettings = useSetAtom(showSettingsDialogAtom);

  const navItems: {
    name: string;
    Icon: LucideIcon;
    onClick?: () => void;
    tab?: AppTab;
  }[] = [
    {
      name: "Home",
      Icon: HomeIcon,
      tab: "home" as const,
    },
    {
      name: "Remove BG",
      Icon: ImageOffIcon,
      tab: "remove-background" as const,
    },
    {
      name: "Settings",
      Icon: SettingsIcon,
      onClick: () => setShowSettings(true),
    },
  ];
  return (
    <div
      className={cn(
        "rounded-box w-18 p-2",
        window.electron.platform === "mac" && "mt-0",
      )}
    >
      {/* NAV ITEMS */}
      <div className="flex flex-col items-center gap-2">
        {navItems.map((item) => (
          <Button
            key={item.name}
            variant={
              item.tab && item.tab === activeTab ? "secondary" : "outline"
            }
            size="lg"
            className={cn(
              "flex size-18 max-w-32 flex-col rounded-xl text-xs",
              item.tab && item.tab === activeTab && "ring-2 ring-primary/20",
            )}
            onClick={() => {
              item.onClick?.();
              if (item.tab) onTabChange(item.tab);
            }}
            aria-current={item.tab === activeTab ? "page" : undefined}
          >
            <item.Icon className="size-5" />
            {item.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Sidenav;
