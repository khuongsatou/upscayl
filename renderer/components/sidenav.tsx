import { cn } from "@/lib/utils";
import { HomeIcon } from "lucide-react";

const Sidenav = () => {
  return (
    <div
      className={cn(
        "bg-base-100 rounded-box w-20 p-4",
        window.electron.platform === "mac" && "mt-6",
      )}
    >
      {/* LOGO */}
      <img
        src="/logo.svg"
        alt="Upscayl Logo"
        className="mx-auto mb-4 h-12 w-12"
      />

      {/* NAV ITEMS */}
      <div className="flex flex-col items-center space-y-4">
        <button className="btn-ghost btn-square btn">
          <HomeIcon className="h-5 w-5" />
        </button>
        {/* Add more nav items here */}
      </div>
    </div>
  );
};

export default Sidenav;
