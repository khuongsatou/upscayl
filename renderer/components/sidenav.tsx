import { cn } from "@/lib/utils";
import {
  HomeIcon,
  ImageUpscaleIcon,
  LucideIcon,
  SettingsIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { useSetAtom } from "jotai";
import { showSettingsDialogAtom } from "@/atoms/toggle-settings";

const Sidenav = () => {
  const setShowSettings = useSetAtom(showSettingsDialogAtom);

  const navItems: {
    name: string;
    Icon: LucideIcon;
    onClick?: () => void;
  }[] = [
    {
      name: "Home",
      Icon: HomeIcon,
    },
    {
      name: "Upscayl",
      Icon: ImageUpscaleIcon,
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
        "rounded-box w-20 p-2",
        window.electron.platform === "mac" && "mt-6",
      )}
    >
      {/* NAV ITEMS */}
      <div className="flex flex-col items-center gap-2">
        {navItems.map((item) => (
          <Button
            key={item.name}
            size="lg"
            className="flex h-20 w-20 max-w-32 flex-col"
            variant="secondary"
            onClick={item.onClick}
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
