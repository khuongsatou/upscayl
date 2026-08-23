import { appRuntime } from "@/lib/app-runtime";

const MacTitlebarDragRegion = () => {
  return appRuntime.platform === "mac" ? (
    <div className="mac-titlebar absolute top-0 h-8 w-full"></div>
  ) : null;
};

export default MacTitlebarDragRegion;
