import {
  SearchIcon,
  MinusIcon,
  PlusIcon,
  RotateCcwIcon,
  InfoIcon,
  MaximizeIcon,
  MinimizeIcon,
  ImagesIcon,
  ImageIcon,
  LayersIcon,
  SparklesIcon,
  TimerIcon,
  HistoryIcon,
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
import CountUp from "../ui/count-up";

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
  hasImage: boolean;
  hasUpscayledImage: boolean;
}

export default function ToolBar({
  zoomAmount,
  setZoomAmount,
  resetImagePaths,
  maximize,
  setMaximize,
  hasImage,
  hasUpscayledImage,
}: ToolBarProps) {
  const t = useAtomValue(translationAtom);
  const userStats = useAtomValue(userStatsAtom);

  const [viewType, setViewType] = useAtom(viewTypeAtom);

  return (
    <div className="absolute right-0 bottom-0 left-0 z-20 flex items-center pb-8">
      <div className="mx-auto inline-flex items-center gap-2 rounded-4xl bg-background p-2 backdrop-blur-sm">
        <Button
          disabled={!hasUpscayledImage}
          variant={viewType === "lens" ? "default" : "secondary"}
          onClick={() => setViewType(viewType === "lens" ? "slider" : "lens")}
          size="icon"
        >
          <SearchIcon />
        </Button>
        <Separator orientation="vertical" className="h-6 w-px shrink-0" />
        <Button
          disabled={
            !hasImage || viewType === "lens" || parseInt(zoomAmount) === 100
          }
          variant="outline"
          size="icon"
          onClick={() =>
            setZoomAmount((prev: string) => Math.max(Number(prev) - 10, 100))
          }
        >
          <MinusIcon />
        </Button>
        <Button
          disabled={
            !hasImage || viewType === "lens" || parseInt(zoomAmount) === 1000
          }
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
          disabled={!hasImage}
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
          <DrawerContent className="mx-auto w-full max-w-xl p-2">
            <DrawerHeader>
              <DrawerTitle className="text-start">Stats</DrawerTitle>
            </DrawerHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-5">
              <div className="rounded-3xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                      {t("Total Upscayls")}
                    </p>
                    <p className="mt-2 text-5xl font-semibold tracking-tight">
                      <CountUp
                        from={0}
                        to={userStats.totalUpscayls}
                        separator=","
                        direction="up"
                        duration={1}
                        className="count-up-text"
                        delay={0}
                      />
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted p-3 text-muted-foreground">
                    <SparklesIcon className="size-6" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                  <ImagesIcon className="size-4 text-primary" />
                  <p className="mt-5 text-2xl font-semibold tracking-tight">
                    <CountUp
                      from={0}
                      to={userStats.batchUpscayls}
                      separator=","
                      direction="up"
                      duration={1}
                      className="count-up-text"
                      delay={0}
                    />
                  </p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">
                    {t("Total Batch Upscayls")}
                  </p>
                </div>

                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                  <ImageIcon className="size-4 text-primary" />
                  <p className="mt-5 text-2xl font-semibold tracking-tight">
                    <CountUp
                      from={0}
                      to={userStats.imageUpscayls}
                      separator=","
                      direction="up"
                      duration={1}
                      className="count-up-text"
                      delay={0}
                    />
                  </p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">
                    {t("Total Image Upscayls")}
                  </p>
                </div>

                <div className="col-span-2 flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                    <LayersIcon className="size-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">
                      <CountUp
                        from={0}
                        to={userStats.doubleUpscayls}
                        separator=","
                        direction="up"
                        duration={1}
                        className="count-up-text"
                        delay={0}
                      />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("Total Double Upscayls")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <TimerIcon className="size-4 text-primary" />
                  <p className="text-sm font-semibold">Performance</p>
                </div>
                <div className="mt-4 grid grid-cols-2 divide-x divide-border">
                  <div className="pr-4">
                    <p className="text-xl font-semibold tracking-tight">
                      {formatDuration(userStats.averageUpscaylTime / 1000)}
                    </p>
                    <p className="mt-1 text-xs leading-snug text-muted-foreground">
                      {t("Average Upscayl Time")}
                    </p>
                  </div>
                  <div className="pl-4">
                    <p className="text-xl font-semibold tracking-tight">
                      {formatDuration(userStats.lastUpscaylDuration / 1000)}
                    </p>
                    <p className="mt-1 text-xs leading-snug text-muted-foreground">
                      {t("Last Upscayl Duration")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-4">
                <HistoryIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("Last Used At")}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {userStats.lastUsedAt
                      ? new Date(userStats.lastUsedAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
        <Separator orientation="vertical" className="h-6 w-px shrink-0" />
        <Button
          disabled={!hasImage}
          variant="destructive"
          size="icon"
          onClick={resetImagePaths}
        >
          <RotateCcwIcon />
        </Button>
      </div>
    </div>
  );
}
