"use client";

import { useState } from "react";
import { ChevronDownIcon, Maximize2, SearchIcon, XIcon } from "lucide-react";
import { ModelId, MODELS } from "@common/models-list";
import { useAtom, useAtomValue } from "jotai";
import { selectedModelIdAtom } from "@/atoms/user-settings-atom";
import { customModelIdsAtom } from "@/atoms/models-list-atom";
import useTranslation from "@/components/hooks/use-translation";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ModelFilter = "all" | "built-in" | "custom";

type ModelOption = {
  id: string;
  name: string;
  description: string;
  kind: Exclude<ModelFilter, "all">;
};

type PreviewPaths = {
  before: string;
  after: string;
};

type Translate = ReturnType<typeof useTranslation>;

const isBuiltInModelId = (modelId: string): modelId is ModelId =>
  modelId in MODELS;

const getPreviewPaths = (modelId: ModelId): PreviewPaths => {
  const basePath = `public:///model-comparison/${MODELS[modelId].id}`;

  return {
    before: `${basePath}/before.webp`,
    after: `${basePath}/after.webp`,
  };
};

type ModelSelectionPanelProps = {
  searchQuery: string;
  modelFilter: ModelFilter;
  customModelCount: number;
  selectedModelId: string;
  visibleModels: ModelOption[];
  onSearchQueryChange: (value: string) => void;
  onModelFilterChange: (filter: ModelFilter) => void;
  onModelSelect: (modelId: string) => void;
};

const ModelSelectionPanel = ({
  searchQuery,
  modelFilter,
  customModelCount,
  selectedModelId,
  visibleModels,
  onSearchQueryChange,
  onModelFilterChange,
  onModelSelect,
}: ModelSelectionPanelProps) => {
  return (
    <div className="flex min-h-0 flex-col rounded-[1.35rem] bg-card/80 p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search models..."
            className="h-11 rounded-full bg-background/70 pr-4 pl-10"
          />
        </div>
        <Select
          value={modelFilter}
          onValueChange={(value) => onModelFilterChange(value as ModelFilter)}
        >
          <SelectTrigger className="h-11 w-full rounded-full bg-background/70 sm:w-[12rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All models</SelectItem>
            <SelectItem value="built-in">Built-in models</SelectItem>
            <SelectItem value="custom">Custom models</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-3 flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>
          {visibleModels.length} model
          {visibleModels.length === 1 ? "" : "s"}
        </span>
        {customModelCount > 0 && (
          <span>{customModelCount} custom imported</span>
        )}
      </div>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto p-2 pr-1">
        {visibleModels.length > 0 ? (
          <div className="space-y-2">
            {visibleModels.map((model) => {
              const isSelected = selectedModelId === model.id;

              return (
                <button
                  type="button"
                  id={model.id}
                  key={model.id}
                  onClick={() => onModelSelect(model.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[1.35rem] bg-background/70 p-4 text-left transition-all hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    isSelected && "bg-muted/55 ring-1 ring-foreground/12",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold tracking-tight">
                          {model.name}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {model.description}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="shrink-0 rounded-full"
                      >
                        {model.kind === "built-in" ? "Built-in" : "Custom"}
                      </Badge>
                    </div>
                  </div>
                  <span
                    className="flex size-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/60"
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <span className="size-2.5 rounded-full bg-foreground" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="ring-dashed flex h-full min-h-40 items-center justify-center rounded-[1.35rem] bg-background/50 p-6 text-center text-sm text-muted-foreground ring-1 ring-border/70">
            No models match your search.
          </div>
        )}
      </div>
    </div>
  );
};

type ModelDetailsPanelProps = {
  modelId: ModelId | null;
  modelName: string;
  modelDescription: string;
  previewPaths: PreviewPaths | null;
  hasPreview: boolean;
  isBeforePreviewUnavailable: boolean;
  isAfterPreviewUnavailable: boolean;
  t: Translate;
  onPreviewUnavailable: (path: string) => void;
  onZoom: (modelId: ModelId) => void;
};

const ModelDetailsPanel = ({
  modelId,
  modelName,
  modelDescription,
  previewPaths,
  hasPreview,
  isBeforePreviewUnavailable,
  isAfterPreviewUnavailable,
  t,
  onPreviewUnavailable,
  onZoom,
}: ModelDetailsPanelProps) => {
  const isBuiltInModel = modelId !== null && previewPaths !== null;

  return (
    <div className="min-h-0 overflow-y-auto rounded-[1.35rem] bg-card/80 p-4 sm:p-5">
      <div className="flex min-h-full flex-col gap-4 pb-1">
        <div className="rounded-[1.35rem] bg-background/70 p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold tracking-tight">
                {modelName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isBuiltInModel
                  ? "Bundled Upscayl model"
                  : "Imported custom model"}
              </p>
            </div>
            <Badge className="rounded-full">Selected</Badge>
          </div>
          {isBuiltInModel ? (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-[1.2rem] bg-card ring-1 ring-border/80">
                <div className="flex aspect-[16/9] min-h-0">
                  <div className="relative w-1/2 overflow-hidden border-r">
                    {isBeforePreviewUnavailable ? (
                      <div className="flex h-full items-center justify-center bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                        Before preview unavailable
                      </div>
                    ) : (
                      <img
                        src={previewPaths.before}
                        alt={`${modelName} ${t("APP.MODEL_SELECTION.BEFORE")}`}
                        className="h-full w-full object-cover"
                        onError={() =>
                          onPreviewUnavailable(previewPaths.before)
                        }
                      />
                    )}
                    <div className="absolute bottom-3 left-3 rounded-full border bg-background/85 px-2.5 py-1 text-xs font-medium">
                      {t("APP.MODEL_SELECTION.BEFORE")}
                    </div>
                  </div>
                  <div className="relative w-1/2 overflow-hidden">
                    {isAfterPreviewUnavailable ? (
                      <div className="flex h-full items-center justify-center bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                        After preview unavailable
                      </div>
                    ) : (
                      <img
                        src={previewPaths.after}
                        alt={`${modelName} ${t("APP.MODEL_SELECTION.AFTER")}`}
                        className="h-full w-full object-cover"
                        onError={() => onPreviewUnavailable(previewPaths.after)}
                      />
                    )}
                    <div className="absolute right-3 bottom-3 rounded-full border bg-background/85 px-2.5 py-1 text-xs font-medium">
                      {t("APP.MODEL_SELECTION.AFTER")}
                    </div>
                  </div>
                </div>
                {hasPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="absolute top-3 right-3 rounded-full bg-background/85"
                    onClick={() => onZoom(modelId)}
                  >
                    <Maximize2 className="size-4" />
                    <span className="sr-only">
                      {t("APP.MODEL_SELECTION.ZOOM")}
                    </span>
                  </Button>
                )}
              </div>
              <div className="rounded-[1.2rem] bg-card/60 p-4 ring-1 ring-border/70">
                <dl className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4 border-b pb-3">
                    <dt className="text-muted-foreground">Recommended for</dt>
                    <dd className="max-w-[13rem] min-w-0 text-right leading-relaxed break-words whitespace-normal">
                      {modelDescription}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-b pb-3">
                    <dt className="text-muted-foreground">Model type</dt>
                    <dd className="max-w-[13rem] min-w-0 text-right leading-relaxed break-words whitespace-normal">
                      Built-in model
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-b pb-3">
                    <dt className="text-muted-foreground">Scale support</dt>
                    <dd className="max-w-[13rem] min-w-0 text-right leading-relaxed break-words whitespace-normal">
                      4x
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Preview</dt>
                    <dd className="max-w-[13rem] min-w-0 text-right leading-relaxed break-words whitespace-normal">
                      {hasPreview
                        ? "Bundled before and after comparison"
                        : "Comparison preview unavailable"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.2rem] bg-card/60 p-4 ring-1 ring-border/70">
              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4 border-b pb-3">
                  <dt className="text-muted-foreground">Model type</dt>
                  <dd className="max-w-[13rem] min-w-0 text-right leading-relaxed break-words whitespace-normal">
                    Custom model
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 border-b pb-3">
                  <dt className="text-muted-foreground">Preview</dt>
                  <dd className="max-w-[13rem] min-w-0 text-right leading-relaxed break-words whitespace-normal">
                    No bundled preview
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Selection</dt>
                  <dd className="max-w-[13rem] min-w-0 text-right leading-relaxed break-words whitespace-normal">
                    Imported models use the filename shown in the list.
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
        <div className="rounded-[1.35rem] bg-background/70 p-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {modelDescription}
          </p>
        </div>
      </div>
    </div>
  );
};

type ModelPreviewDialogProps = {
  modelId: ModelId | null;
  t: Translate;
  onClose: () => void;
};

const ModelPreviewDialog = ({
  modelId,
  t,
  onClose,
}: ModelPreviewDialogProps) => {
  if (!modelId) return null;

  const previewPaths = getPreviewPaths(modelId);

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-full overflow-hidden border-border/80 bg-popover p-0 sm:max-h-[90vh] sm:max-w-[90vw]"
      >
        <DialogHeader className="border-b bg-muted/30 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {t(`APP.MODEL_SELECTION.MODELS.${modelId}.NAME`)}
              </DialogTitle>
              <DialogDescription>
                Compare the bundled before and after preview
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground"
              >
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="bg-black p-0">
          <div className="flex max-h-[calc(90vh-6rem)] min-h-[20rem] w-full bg-black">
            <div className="relative w-1/2">
              <img
                src={previewPaths.before}
                alt="Zoomed in Image - Before"
                className="h-full w-full object-contain"
              />
              <div className="absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1 text-sm text-white">
                {t("APP.MODEL_SELECTION.BEFORE")}
              </div>
            </div>
            <div className="relative w-1/2">
              <img
                src={previewPaths.after}
                alt="Zoomed in Image - After"
                className="h-full w-full object-contain"
              />
              <div className="absolute right-4 bottom-4 rounded-full bg-black/70 px-3 py-1 text-sm text-white">
                {t("APP.MODEL_SELECTION.AFTER")}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SelectModelDialog = () => {
  const t = useTranslation();
  const [selectedModelId, setSelectedModelId] = useAtom(selectedModelIdAtom);
  const customModelIds = useAtomValue(customModelIdsAtom);
  const [open, setOpen] = useState(false);
  const [draftModelId, setDraftModelId] = useState(selectedModelId);
  const [zoomedModelId, setZoomedModelId] = useState<ModelId | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [modelFilter, setModelFilter] = useState<ModelFilter>("all");
  const [brokenPreviewPaths, setBrokenPreviewPaths] = useState<string[]>([]);

  const setModelDialogOpen = (isOpen: boolean) => {
    if (isOpen) {
      setDraftModelId(selectedModelId);
      setSearchQuery("");
      setModelFilter("all");
    }

    setOpen(isOpen);
  };

  const selectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    setOpen(false);

    posthog.capture("model_selected", {
      $ip: "0.0.0.0",
      $geoip_disable: true,
      model: modelId,
    });
  };

  const markPreviewUnavailable = (path: string) => {
    setBrokenPreviewPaths((paths) =>
      paths.includes(path) ? paths : [...paths, path],
    );
  };

  const selectedBuiltInModelId = isBuiltInModelId(draftModelId)
    ? draftModelId
    : null;
  const currentBuiltInModelId = isBuiltInModelId(selectedModelId)
    ? selectedModelId
    : null;
  const previewPaths = selectedBuiltInModelId
    ? getPreviewPaths(selectedBuiltInModelId)
    : null;
  const isBeforePreviewUnavailable =
    previewPaths !== null && brokenPreviewPaths.includes(previewPaths.before);
  const isAfterPreviewUnavailable =
    previewPaths !== null && brokenPreviewPaths.includes(previewPaths.after);
  const hasPreview =
    previewPaths !== null &&
    !isBeforePreviewUnavailable &&
    !isAfterPreviewUnavailable;
  const selectedModelName = selectedBuiltInModelId
    ? t(`APP.MODEL_SELECTION.MODELS.${selectedBuiltInModelId}.NAME`)
    : draftModelId;
  const selectedModelDescription = selectedBuiltInModelId
    ? t(`APP.MODEL_SELECTION.MODELS.${selectedBuiltInModelId}.DESCRIPTION`)
    : "Imported custom model";
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleModels = [
    ...(Object.keys(MODELS) as ModelId[]).map((modelId) => ({
      id: modelId,
      name: t(`APP.MODEL_SELECTION.MODELS.${modelId}.NAME`),
      description: t(`APP.MODEL_SELECTION.MODELS.${modelId}.DESCRIPTION`),
      kind: "built-in" as const,
    })),
    ...customModelIds.map((modelId) => ({
      id: modelId,
      name: modelId,
      description: "Imported custom model",
      kind: "custom" as const,
    })),
  ].filter((model) => {
    const matchesFilter = modelFilter === "all" || model.kind === modelFilter;
    const matchesSearch =
      !normalizedSearchQuery ||
      model.name.toLowerCase().includes(normalizedSearchQuery) ||
      model.description.toLowerCase().includes(normalizedSearchQuery);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="outline"
        className="h-auto min-h-12 justify-start rounded-xl bg-card px-3 py-2.5 text-left shadow-sm hover:border-foreground/20 hover:bg-muted/50"
        size="lg"
        onClick={() => setModelDialogOpen(true)}
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-semibold">
            {currentBuiltInModelId
              ? t(`APP.MODEL_SELECTION.MODELS.${currentBuiltInModelId}.NAME`)
              : selectedModelId}
          </span>
          {currentBuiltInModelId && (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {t(
                `APP.MODEL_SELECTION.MODELS.${currentBuiltInModelId}.DESCRIPTION`,
              )}
            </span>
          )}
        </span>
        <ChevronDownIcon className="ml-auto size-4 text-muted-foreground" />
      </Button>

      <Dialog open={open} onOpenChange={setModelDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="h-[44rem] max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden border bg-popover p-0 shadow-xl sm:max-w-5xl"
        >
          <DialogHeader className="border-b bg-muted/30 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <DialogTitle className="text-3xl font-semibold tracking-tight">
                  Select AI model
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Choose the best model for your image
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-muted-foreground"
                >
                  <XIcon className="size-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          <div className="min-h-0 flex-1 p-4 sm:p-5">
            <div className="grid h-full min-h-0 gap-5 rounded-[1.5rem] bg-muted/15 p-2 sm:p-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
              <ModelSelectionPanel
                searchQuery={searchQuery}
                modelFilter={modelFilter}
                customModelCount={customModelIds.length}
                selectedModelId={draftModelId}
                visibleModels={visibleModels}
                onSearchQueryChange={setSearchQuery}
                onModelFilterChange={setModelFilter}
                onModelSelect={setDraftModelId}
              />
              <ModelDetailsPanel
                modelId={selectedBuiltInModelId}
                modelName={selectedModelName}
                modelDescription={selectedModelDescription}
                previewPaths={previewPaths}
                hasPreview={hasPreview}
                isBeforePreviewUnavailable={isBeforePreviewUnavailable}
                isAfterPreviewUnavailable={isAfterPreviewUnavailable}
                t={t}
                onPreviewUnavailable={markPreviewUnavailable}
                onZoom={setZoomedModelId}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-5 py-4 sm:px-6">
            <DialogClose asChild>
              <Button variant="outline" className="min-w-28 rounded-full">
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="min-w-32 rounded-full"
              onClick={() => selectModel(draftModelId)}
            >
              Use Model
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ModelPreviewDialog
        modelId={zoomedModelId}
        t={t}
        onClose={() => setZoomedModelId(null)}
      />
    </div>
  );
};

export default SelectModelDialog;
