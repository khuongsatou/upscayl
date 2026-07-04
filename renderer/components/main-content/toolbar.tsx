import {
  SearchIcon,
  MinusIcon,
  PlusIcon,
  RotateCcwIcon,
  InfoIcon,
  MaximizeIcon,
  MinimizeIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { userStatsAtom, viewTypeAtom } from "@/atoms/user-settings-atom";
import { useAtom, useAtomValue } from "jotai";
import { Separator } from "../ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { translationAtom } from "@/atoms/translations-atom";
import React from "react";

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

interface ToolBarProps {
  zoomAmount: string;
  setZoomAmount: (arg: any) => void;
  resetImagePaths: () => void;
  maximize: boolean;
  setMaximize: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ToolBar({
  zoomAmount,
  setZoomAmount,
  resetImagePaths,
  maximize,
  setMaximize,
}: ToolBarProps) {
  const t = useAtomValue(translationAtom);
  const userStats = useAtomValue(userStatsAtom);

  const [viewType, setViewType] = useAtom(viewTypeAtom);

  return (
    <div className="absolute right-0 bottom-0 left-0 z-20 flex items-center pb-8">
      <div className="mx-auto inline-flex items-center gap-2 rounded-4xl bg-black/30 p-2 backdrop-blur-sm">
        <Button
          variant={viewType === "lens" ? "default" : "secondary"}
          onClick={() => setViewType(viewType === "lens" ? "slider" : "lens")}
          size="icon"
        >
          <SearchIcon />
        </Button>
        <Separator orientation="vertical" className="h-6 w-px shrink-0" />
        <Button
          disabled={viewType === "lens" || parseInt(zoomAmount) === 100}
          variant="outline"
          size="icon"
          onClick={() =>
            setZoomAmount((prev: string) => Math.max(Number(prev) - 10, 100))
          }
        >
          <MinusIcon />
        </Button>
        <Button
          disabled={viewType === "lens" || parseInt(zoomAmount) === 1000}
          variant="outline"
          size="icon"
          onClick={() =>
            setZoomAmount((prev: string) => Math.min(Number(prev) + 10, 1000))
          }
        >
          <PlusIcon />
        </Button>
        <Separator orientation="vertical" className="h-6 w-px shrink-0" />
        <Button
          variant="outline"
          size="icon"
          className="group"
          onClick={() => setMaximize((prev) => !prev)}
        >
          {maximize ? <MinimizeIcon /> : <MaximizeIcon />}
        </Button>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" size="icon">
              <InfoIcon />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="text-start">Stats</DrawerTitle>
            </DrawerHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-2 px-4">
              <div className="stats stats-vertical overflow-y-auto">
                <div className="stat">
                  <div className="stat-title">
                    {t("APP.MORE_OPTIONS_DRAWER.TOTAL_UPSCAYLS")}
                  </div>
                  <div className="stat-value text-base-content text-2xl">
                    {userStats.totalUpscayls}
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-title">
                    {t("APP.MORE_OPTIONS_DRAWER.TOTAL_BATCH_UPSCAYLS")}
                  </div>
                  <div className="stat-value text-base-content text-2xl">
                    {userStats.batchUpscayls}
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-title">
                    {t("APP.MORE_OPTIONS_DRAWER.TOTAL_IMAGE_UPSCAYLS")}
                  </div>
                  <div className="stat-value text-base-content text-2xl">
                    {userStats.imageUpscayls}
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-title">
                    {t("APP.MORE_OPTIONS_DRAWER.TOTAL_DOUBLE_UPSCAYLS")}
                  </div>
                  <div className="stat-value text-base-content text-2xl">
                    {userStats.doubleUpscayls}
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-title">
                    {t("APP.MORE_OPTIONS_DRAWER.AVERAGE_UPSCAYL_TIME")}
                  </div>
                  <div className="stat-value text-base-content text-2xl">
                    {formatDuration(userStats.averageUpscaylTime / 1000)}
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-title">
                    {t("APP.MORE_OPTIONS_DRAWER.LAST_UPSCAYL_DURATION")}
                  </div>
                  <div className="stat-value text-base-content text-2xl">
                    {formatDuration(userStats.lastUpscaylDuration / 1000)}
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-title">
                    {t("APP.MORE_OPTIONS_DRAWER.LAST_USED_AT")}
                  </div>
                  <div className="stat-value text-base-content text-2xl">
                    {new Date(userStats.lastUsedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
        <Separator orientation="vertical" className="h-6 w-px shrink-0" />
        <Button variant="destructive" size="icon" onClick={resetImagePaths}>
          <RotateCcwIcon />
        </Button>
      </div>
    </div>
  );
}
