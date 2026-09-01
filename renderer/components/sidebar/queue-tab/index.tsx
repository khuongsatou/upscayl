import {
  compressionAtom,
  copyMetadataAtom,
  customWidthAtom,
  gpuIdAtom,
  noImageProcessingAtom,
  overwriteAtom,
  progressAtom,
  queueProcessingAtom,
  saveImageAsAtom,
  scaleAtom,
  selectedModelIdAtom,
  tileSizeAtom,
  ttaModeAtom,
  upscaleQueueItemsAtom,
  useCustomWidthAtom,
  userStatsAtom,
} from "@/atoms/user-settings-atom";
import { translationAtom } from "@/atoms/translations-atom";
import { useToast } from "@/components/ui/use-toast";
import {
  appRuntime,
  getRuntimeFileName,
  WEB_OUTPUT_PATH,
} from "@/lib/app-runtime";
import { ImageFormat, VALID_IMAGE_FORMATS } from "@/lib/valid-formats";
import { ELECTRON_COMMANDS } from "@common/electron-commands";
import { ImageUpscaylPayload } from "@common/types/types";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  ExternalLink,
  ListFilter,
  Pause,
  Play,
  Search,
  Square,
  Trash2,
} from "lucide-react";
import { toImageSrc } from "@/lib/image-src";
import SliderView from "@/components/main-content/slider-view";
import { useEffect, useMemo, useRef, useState } from "react";

type QueueFilter =
  | "all"
  | "queued"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled";

const PAGE_SIZE = 5;

const getDisplayName = (path: string) => {
  const runtimeName = getRuntimeFileName(path);
  return runtimeName.split(/[\\/]/).pop() || runtimeName || "image";
};

const normalizeProgress = (value: string) => {
  const progress = Number.parseFloat(value.replace("%", ""));
  if (!Number.isFinite(progress)) return null;
  return Math.min(100, Math.max(0, progress));
};

const isValidImagePath = (path: string) => {
  const extension = getDisplayName(path).split(".").pop()?.toLowerCase();
  return VALID_IMAGE_FORMATS.includes(extension as ImageFormat);
};

function QueueTab({
  imagePath,
  outputPath,
  visible,
}: {
  imagePath: string;
  outputPath: string | null;
  visible: boolean;
}) {
  const { toast } = useToast();
  const t = useAtomValue(translationAtom);
  const [items, setItems] = useAtom(upscaleQueueItemsAtom);
  const [isProcessing, setIsProcessing] = useAtom(queueProcessingAtom);
  const selectedModelId = useAtomValue(selectedModelIdAtom);
  const gpuId = useAtomValue(gpuIdAtom);
  const saveImageAs = useAtomValue(saveImageAsAtom);
  const scale = useAtomValue(scaleAtom);
  const overwrite = useAtomValue(overwriteAtom);
  const noImageProcessing = useAtomValue(noImageProcessingAtom);
  const compression = useAtomValue(compressionAtom);
  const customWidth = useAtomValue(customWidthAtom);
  const useCustomWidth = useAtomValue(useCustomWidthAtom);
  const tileSize = useAtomValue(tileSizeAtom);
  const ttaMode = useAtomValue(ttaModeAtom);
  const copyMetadata = useAtomValue(copyMetadataAtom);
  const [activeProgress, setGlobalProgress] = useAtom(progressAtom);
  const setUserStats = useSetAtom(userStatsAtom);

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [page, setPage] = useState(1);
  const [paused, setPaused] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<"side-by-side" | "slider">("side-by-side");
  const currentItemRef = useRef<string | null>(null);
  const itemsRef = useRef(items);
  const pausedRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const startedAtRef = useRef(0);

  useEffect(() => {
    currentItemRef.current = currentItemId;
  }, [currentItemId]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.name.toLowerCase().includes(normalizedSearch);
      const matchesFilter = filter === "all" || item.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [filter, items, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const previewItem = items.find((item) => item.id === previewItemId) ?? null;
  const queuedCount = items.filter((item) => item.status === "queued").length;
  const doneCount = items.filter((item) => item.status === "succeeded").length;
  const failedCount = items.filter((item) => item.status === "failed").length;
  const statusLabels: Record<QueueFilter, string> = {
    all: t("QUEUE.FILTER.ALL"),
    queued: t("QUEUE.STATUS.QUEUED"),
    processing: t("QUEUE.STATUS.PROCESSING"),
    succeeded: t("QUEUE.STATUS.SUCCEEDED"),
    failed: t("QUEUE.STATUS.FAILED"),
    canceled: t("QUEUE.STATUS.CANCELED"),
  };

  useEffect(() => {
    setPage(1);
  }, [filter, searchTerm]);

  const updateItem = (
    id: string,
    updater: (item: (typeof items)[number]) => (typeof items)[number],
  ) => {
    setItems((previous) =>
      previous.map((item) => (item.id === id ? updater(item) : item)),
    );
  };

  const enqueuePaths = (paths: string[]) => {
    const validPaths = paths.filter(isValidImagePath);
    if (!validPaths.length) {
      toast({ description: t("QUEUE.INVALID_IMAGES") });
      return;
    }

    const now = Date.now();
    setItems((previous) => [
      ...previous,
      ...validPaths.map((path, index) => ({
        id: `${now}-${index}-${crypto.randomUUID()}`,
        imagePath: path,
        name: getDisplayName(path),
        status: "queued" as const,
        progress: 0,
        createdAt: now + index,
      })),
    ]);
  };

  const addSelectedImages = async () => {
    const paths = (await appRuntime.invoke(ELECTRON_COMMANDS.SELECT_FILES)) as
      | string[]
      | null;
    if (!paths?.length) return;
    enqueuePaths(paths);
  };

  const addCurrentImage = () => {
    if (!imagePath || !isValidImagePath(imagePath)) {
      toast({ description: t("QUEUE.NO_CURRENT_IMAGE") });
      return;
    }
    enqueuePaths([imagePath]);
  };

  const buildPayload = (path: string): ImageUpscaylPayload => ({
    imagePath: path,
    outputPath: outputPath || WEB_OUTPUT_PATH,
    model: selectedModelId,
    gpuId: gpuId.length === 0 ? null : gpuId,
    saveImageAs,
    scale,
    overwrite,
    noImageProcessing,
    compression: compression.toString(),
    customWidth: customWidth > 0 ? customWidth.toString() : null,
    useCustomWidth,
    tileSize,
    ttaMode,
    copyMetadata,
  });

  const startNextItem = () => {
    if (pausedRef.current) {
      setIsProcessing(false);
      setCurrentItemId(null);
      return;
    }

    const nextItem =
      itemsRef.current.find((item) => item.status === "queued") ?? null;
    if (!nextItem) {
      setIsProcessing(false);
      setCurrentItemId(null);
      return;
    }

    setItems((previous) =>
      previous.map((item) =>
        item.id === nextItem.id
          ? {
              ...item,
              status: "processing",
              progress: 0,
              error: undefined,
              startedAt: Date.now(),
              finishedAt: undefined,
            }
          : item,
      ),
    );

    stopRequestedRef.current = false;
    startedAtRef.current = Date.now();
    setIsProcessing(true);
    setCurrentItemId(nextItem.id);
    setUserStats((previous) => ({
      ...previous,
      totalUpscayls: previous.totalUpscayls + 1,
      imageUpscayls: previous.imageUpscayls + 1,
      lastUsedAt: Date.now(),
    }));
    appRuntime.send<ImageUpscaylPayload>(
      ELECTRON_COMMANDS.UPSCAYL,
      buildPayload(nextItem.imagePath),
    );
  };

  const startQueue = () => {
    if (isProcessing) return;
    if (activeProgress.length > 0) {
      toast({ description: t("QUEUE.BUSY") });
      return;
    }
    setPaused(false);
    pausedRef.current = false;
    startNextItem();
  };

  const pauseQueue = () => {
    setPaused(true);
    pausedRef.current = true;
  };

  const stopCurrent = () => {
    if (!currentItemRef.current) return;
    stopRequestedRef.current = true;
    setPaused(true);
    pausedRef.current = true;
    appRuntime.send(ELECTRON_COMMANDS.STOP);
  };

  const clearFinished = () => {
    setItems((previous) =>
      previous.filter(
        (item) =>
          item.status === "queued" || item.status === "processing",
      ),
    );
  };

  const removeItem = (id: string) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
  };

  const retryItem = (id: string) => {
    updateItem(id, (item) => ({
      ...item,
      status: "queued",
      progress: 0,
      error: undefined,
      resultPath: undefined,
      finishedAt: undefined,
    }));
  };

  useEffect(() => {
    const progressHandler = (_: unknown, data: string) => {
      const id = currentItemRef.current;
      const progress = normalizeProgress(data);
      if (!id || progress === null) return;
      setGlobalProgress("");
      updateItem(id, (item) => ({ ...item, progress }));
    };

    const doneHandler = (_: unknown, resultPath: string) => {
      const id = currentItemRef.current;
      if (!id) return;
      setGlobalProgress("");
      const duration = Date.now() - startedAtRef.current;
      updateItem(id, (item) => ({
        ...item,
        status: "succeeded",
        progress: 100,
        resultPath,
        finishedAt: Date.now(),
      }));
      setUserStats((previous) => ({
        ...previous,
        lastUpscaylDuration: duration,
        averageUpscaylTime:
          (previous.averageUpscaylTime * Math.max(0, previous.totalUpscayls - 1) +
            duration) /
          Math.max(1, previous.totalUpscayls),
      }));
      setCurrentItemId(null);
      setTimeout(startNextItem, 250);
    };

    const errorHandler = (_: unknown, message: string) => {
      const id = currentItemRef.current;
      if (!id) return;
      setGlobalProgress("");
      updateItem(id, (item) => ({
        ...item,
        status: stopRequestedRef.current ? "canceled" : "failed",
        error: message,
        finishedAt: Date.now(),
      }));
      setCurrentItemId(null);
      stopRequestedRef.current = false;
      setTimeout(startNextItem, 250);
    };

    appRuntime.on(ELECTRON_COMMANDS.UPSCAYL_PROGRESS, progressHandler);
    appRuntime.on(ELECTRON_COMMANDS.UPSCAYL_DONE, doneHandler);
    appRuntime.on(ELECTRON_COMMANDS.UPSCAYL_ERROR, errorHandler);

    return () => {
      appRuntime.off(ELECTRON_COMMANDS.UPSCAYL_PROGRESS, progressHandler);
      appRuntime.off(ELECTRON_COMMANDS.UPSCAYL_DONE, doneHandler);
      appRuntime.off(ELECTRON_COMMANDS.UPSCAYL_ERROR, errorHandler);
    };
  }, [
    compression,
    copyMetadata,
    customWidth,
    gpuId,
    noImageProcessing,
    outputPath,
    overwrite,
    saveImageAs,
    scale,
    selectedModelId,
    tileSize,
    ttaMode,
    useCustomWidth,
  ]);

  return (
    <div
      className={`${visible ? "flex" : "hidden"} h-screen flex-col gap-4 overflow-y-auto overflow-x-hidden p-5`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold uppercase">{t("QUEUE.TITLE")}</p>
          <p className="text-xs text-base-content/70">
            {t("QUEUE.SUMMARY", {
              queued: queuedCount.toString(),
              done: doneCount.toString(),
              failed: failedCount.toString(),
            })}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            className="btn btn-square btn-primary btn-sm"
            onClick={addSelectedImages}
            title={t("QUEUE.ADD_IMAGES")}
          >
            <CirclePlus size={16} />
          </button>
          <button
            className="btn btn-square btn-ghost btn-sm"
            onClick={clearFinished}
            title={t("QUEUE.CLEAR_FINISHED")}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <button
        className="btn btn-outline btn-sm w-full"
        onClick={addCurrentImage}
      >
        {t("QUEUE.ADD_CURRENT")}
      </button>

      <div className="grid grid-cols-3 gap-2">
        <button
          className="btn btn-primary btn-sm"
          disabled={isProcessing || queuedCount === 0}
          onClick={startQueue}
        >
          <Play size={14} />
          {t("QUEUE.START")}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          disabled={!isProcessing}
          onClick={pauseQueue}
        >
          <Pause size={14} />
          {t("QUEUE.PAUSE")}
        </button>
        <button
          className="btn btn-error btn-sm"
          disabled={!currentItemId}
          onClick={stopCurrent}
        >
          <Square size={14} />
          {t("QUEUE.STOP")}
        </button>
      </div>

      <label className="input input-bordered flex h-10 items-center gap-2">
        <Search size={16} />
        <input
          className="w-full text-sm"
          placeholder={t("QUEUE.SEARCH_PLACEHOLDER")}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </label>

      <label className="flex items-center gap-2">
        <ListFilter size={16} />
        <select
          className="select select-bordered select-sm w-full"
          value={filter}
          onChange={(event) => setFilter(event.target.value as QueueFilter)}
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {previewItem && (
        <section className="flex flex-col gap-2 rounded-lg border border-primary/40 bg-base-200 p-3" aria-label={`Preview ${previewItem.name}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold" title={previewItem.name}>{previewItem.name}</p>
            <button className="btn btn-ghost btn-xs" onClick={() => setPreviewItemId(null)} aria-label="Close preview">×</button>
          </div>
          {previewItem.resultPath && (
            <div className="flex gap-1">
              <button className={`btn btn-xs flex-1 ${compareMode === "side-by-side" ? "btn-primary" : "btn-ghost"}`} onClick={() => setCompareMode("side-by-side")}>Side by side</button>
              <button className={`btn btn-xs flex-1 ${compareMode === "slider" ? "btn-primary" : "btn-ghost"}`} onClick={() => setCompareMode("slider")}>Slider</button>
            </div>
          )}
          {previewItem.resultPath && compareMode === "slider" ? (
            <div className="flex flex-col gap-1">
              <SliderView sanitizedImagePath={previewItem.imagePath} sanitizedUpscaledImagePath={previewItem.resultPath} zoomAmount="100" className="h-64 w-full rounded bg-base-100" />
            </div>
          ) : (
            <div className="grid min-h-32 grid-cols-2 gap-2">
              <div className="flex min-h-32 items-center justify-center overflow-hidden rounded bg-base-100 p-1"><img src={toImageSrc(previewItem.imagePath)} alt={`${previewItem.name} original`} className="max-h-40 max-w-full object-contain" /></div>
              <div className="flex min-h-32 items-center justify-center overflow-hidden rounded bg-base-100 p-1">{previewItem.resultPath ? <img src={toImageSrc(previewItem.resultPath)} alt={`${previewItem.name} result`} className="max-h-40 max-w-full object-contain" /> : <span className="text-center text-xs text-base-content/60">Result preview appears when processing finishes.</span>}</div>
            </div>
          )}
          <p className="text-xs capitalize text-base-content/70">{statusLabels[previewItem.status]} · {Math.round(previewItem.progress)}%</p>
        </section>
      )}

      <div className="flex flex-col gap-2">
        {pageItems.length === 0 && (
          <div className="rounded-lg border border-base-300 bg-base-200 p-4 text-sm text-base-content/70">
            {t("QUEUE.EMPTY")}
          </div>
        )}

        {pageItems.map((item) => (
          <div
            key={item.id}
            className={`cursor-pointer rounded-lg border bg-base-200 p-3 transition-colors hover:border-primary ${previewItemId === item.id ? "border-primary" : "border-base-300"}`}
            role="button"
            tabIndex={0}
            onClick={() => setPreviewItemId(item.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setPreviewItemId(item.id);
              }
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" title={item.name}>
                  {item.name}
                </p>
                <p className="text-xs capitalize text-base-content/60">
                  {statusLabels[item.status]} - {Math.round(item.progress)}%
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {item.resultPath && (
                  <button
                    className="btn btn-square btn-ghost btn-xs"
                    onClick={() => window.open(item.resultPath, "_blank")}
                    title={t("QUEUE.OPEN_RESULT")}
                  >
                    <ExternalLink size={13} />
                  </button>
                )}
                {(item.status === "failed" || item.status === "canceled") && (
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => retryItem(item.id)}
                  >
                    {t("QUEUE.RETRY")}
                  </button>
                )}
                {item.status !== "processing" && (
                  <button
                    className="btn btn-square btn-ghost btn-xs"
                    onClick={() => removeItem(item.id)}
                    title={t("QUEUE.REMOVE")}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
            <progress
              className="progress progress-primary mt-2 h-2 w-full"
              value={item.progress}
              max={100}
            />
            {item.error && (
              <p className="mt-2 line-clamp-2 text-xs text-error">
                {item.error}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pb-2">
        <button
          className="btn btn-square btn-ghost btn-sm"
          disabled={currentPage <= 1}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          title={t("QUEUE.PREV_PAGE")}
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-xs text-base-content/70">
          {t("QUEUE.PAGE", {
            page: currentPage.toString(),
            total: totalPages.toString(),
          })}
        </p>
        <button
          className="btn btn-square btn-ghost btn-sm"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          title={t("QUEUE.NEXT_PAGE")}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default QueueTab;
