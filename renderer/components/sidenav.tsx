import { cn } from "@/lib/utils";
import {
  HomeIcon,
  ImageUpscaleIcon,
  LucideIcon,
  SettingsIcon,
} from "lucide-react";
import { Button } from "./ui/button";

const navItems: {
  name: string;
  Icon: LucideIcon;
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
  },
];

const Sidenav = () => {
  return (
    <div
      className={cn(
        "w-20 rounded-box p-4",
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
