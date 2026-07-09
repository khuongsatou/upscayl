"use client";

import React, { useState } from "react";
import { ChevronDownIcon, Maximize2, SwatchBookIcon, X } from "lucide-react";
import { ModelId, MODELS } from "@common/models-list";
import { useAtom, useAtomValue } from "jotai";
import { selectedModelIdAtom } from "@/atoms/user-settings-atom";
import { customModelIdsAtom } from "@/atoms/models-list-atom";
import useTranslation from "@/components/hooks/use-translation";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SelectModelDialog = () => {
  const t = useTranslation();
  const [selectedModelId, setSelectedModelId] = useAtom(selectedModelIdAtom);

  const customModelIds = useAtomValue(customModelIdsAtom);
  const [open, setOpen] = useState(false);
  const [zoomedModel, setZoomedModel] = useState<ModelId | null>(null);

  const handleModelSelect = (model: ModelId | string) => {
    setSelectedModelId(model);
    setOpen(false);

    posthog.capture("model_selected", {
      $ip: "0.0.0.0",
      $geoip_disable: true,
      model,
    });
  };

  const handleZoom = (event: React.MouseEvent, model: ModelId) => {
    event.stopPropagation();
    setZoomedModel(model);
  };

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="outline"
        className="justify-start rounded-lg pr-2"
        size="lg"
        onClick={() => setOpen(true)}
      >
        <SwatchBookIcon />
        {selectedModelId in MODELS ? (
          <div>
            {t(
              `APP.MODEL_SELECTION.MODELS.${MODELS[selectedModelId]?.id}.NAME` as any,
            )}
          </div>
        ) : (
          selectedModelId
        )}
        <ChevronDownIcon className="ml-auto" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("APP.MODEL_SELECTION.DESCRIPTION")}</DialogTitle>
          </DialogHeader>
          <div className="max-h-150 w-full scrollbar-none overflow-y-auto">
            <div className="overflow-y-none columns gap-3 space-y-3 sm:columns-2">
              {Object.entries(MODELS).map((modelData) => {
                const modelId = modelData[0] as ModelId;
                const model = modelData[1];

                return (
                  <div
                    id={modelId}
                    key={modelId}
                    onClick={() => handleModelSelect(modelId)}
                    className="flex cursor-pointer break-inside-avoid flex-col gap-2 rounded-2xl border bg-secondary p-2"
                  >
                    <div className="relative flex overflow-hidden rounded-xl">
                      <img
                        src={`public:///model-comparison/${model.id}/before.webp`}
                        alt={`Model Before`}
                        className="h-full w-1/2 object-cover"
                      />
                      <img
                        src={`public:///model-comparison/${model.id}/after.webp`}
                        alt={`Model After`}
                        className="h-full w-1/2 object-cover"
                      />

                      <div className="bg-opacity-50 absolute bottom-2 left-2 rounded bg-black px-1 text-xs text-white">
                        {t("APP.MODEL_SELECTION.BEFORE")}
                      </div>
                      <div className="bg-opacity-50 absolute right-2 bottom-2 rounded bg-black px-1 text-xs text-white">
                        {t("APP.MODEL_SELECTION.AFTER")}
                      </div>

                      <button
                        className="btn btn-circle btn-secondary btn-sm absolute top-2 right-2"
                        onClick={(e) => handleZoom(e, modelId)}
                      >
                        <Maximize2 className="h-4 w-4" />
                        <span className="sr-only">
                          {t("APP.MODEL_SELECTION.ZOOM")}
                        </span>
                      </button>
                    </div>
                    <div>
                      <p className="font-semibold">
                        {t(`APP.MODEL_SELECTION.MODELS.${modelId}.NAME`)}
                      </p>
                      <p className="text-base-content/70 text-left leading-normal font-normal hover:line-clamp-none">
                        {t(`APP.MODEL_SELECTION.MODELS.${modelId}.DESCRIPTION`)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {customModelIds.length > 0 && (
                <p className="text-base-content font-semibold">
                  {t("APP.MODEL_SELECTION.IMPORTED_CUSTOM_MODELS")}
                </p>
              )}
              {customModelIds.map((customModel) => {
                return (
                  <button
                    key={customModel}
                    className="btn rounded-box bg-base-100 h-auto w-full items-start p-4 text-left shadow-sm"
                    onClick={() => handleModelSelect(customModel)}
                  >
                    {customModel}
                  </button>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button className="rounded-lg">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!zoomedModel}
        onOpenChange={(state) => !state && setZoomedModel(null)}
      >
        <DialogContent className="w-full sm:max-h-11/12 sm:max-w-11/12">
          <DialogHeader>
            <DialogTitle>{MODELS[zoomedModel]?.id}</DialogTitle>
          </DialogHeader>
          <div className="max-w-full rounded-none bg-black p-0">
            <div className="relative flex h-full w-full items-center justify-center bg-black">
              <div className="flex h-full w-full">
                <div className="relative h-full w-1/2">
                  <img
                    src={`public:///model-comparison/${MODELS[zoomedModel]?.id}/before.webp`}
                    alt={`Zoomed in Image - Before`}
                    className="h-full w-full object-contain"
                  />
                  <div className="bg-opacity-50 absolute bottom-4 left-4 rounded bg-black px-2 py-1 text-sm text-white">
                    Before
                  </div>
                </div>
                <div className="relative h-full w-1/2">
                  <img
                    src={`public:///model-comparison/${MODELS[zoomedModel]?.id}/after.webp`}
                    alt={`Zoomed in Image - After`}
                    className="h-full w-full object-contain"
                  />
                  <div className="bg-opacity-50 absolute right-4 bottom-4 rounded bg-black px-2 py-1 text-sm text-white">
                    After
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SelectModelDialog;
