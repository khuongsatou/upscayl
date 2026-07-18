import { useAtom, useAtomValue } from "jotai";
import React, { useEffect, useState } from "react";
import { themeChange } from "theme-change";
import useLogger from "../../hooks/use-logger";
import {
  savedOutputPathAtom,
  progressAtom,
  rememberOutputFolderAtom,
  scaleAtom,
  customWidthAtom,
  useCustomWidthAtom,
  saveImageAsAtom,
} from "../../../atoms/user-settings-atom";
import { FEATURE_FLAGS } from "@common/feature-flags";
import { ELECTRON_COMMANDS } from "@common/electron-commands";
import { useToast } from "@/components/ui/use-toast";
import { translationAtom } from "@/atoms/translations-atom";
import { SelectImageScale } from "../settings-tab/select-image-scale";
import SelectModelDialog from "./select-model-dialog";
import { ImageFormat } from "@/lib/valid-formats";
import { Button } from "@/components/ui/button";
import useUpscaylResolution from "@/components/hooks/use-upscayl-resolution";
import {
  CloudUpload,
  FolderIcon,
  SparklesIcon,
  UploadIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SelectImageFormat } from "../settings-tab/select-image-format";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { sanitizePath } from "@common/sanitize-path";
import getFilenameFromPath from "@common/get-file-name";

interface IProps {
  selectImageHandler: () => Promise<void>;
  selectFolderHandler: () => Promise<void>;
  importDroppedPath: (path: string) => Promise<void>;
  imagePath: string;
  upscaylHandler: () => Promise<void>;
  batchMode: boolean;
  setBatchMode: React.Dispatch<React.SetStateAction<boolean>>;
  doubleUpscayl: boolean;
  setDoubleUpscayl: React.Dispatch<React.SetStateAction<boolean>>;
  dimensions: {
    width: number | null;
    height: number | null;
  };
  setSaveImageAs: React.Dispatch<React.SetStateAction<ImageFormat>>;
  setGpuId: React.Dispatch<React.SetStateAction<string>>;
}

function UpscaylSteps({
  selectImageHandler,
  selectFolderHandler,
  importDroppedPath,
  imagePath,
  upscaylHandler,
  batchMode,
  setBatchMode,
  doubleUpscayl,
  setDoubleUpscayl,
  dimensions,
}: IProps) {
  const [scale, setScale] = useAtom(scaleAtom);
  const [outputPath, setOutputPath] = useAtom(savedOutputPathAtom);
  const [progress, setProgress] = useAtom(progressAtom);
  const [saveImageAs, setSaveImageAs] = useAtom(saveImageAsAtom);
  const [isInputDragging, setIsInputDragging] = useState(false);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const rememberOutputFolder = useAtomValue(rememberOutputFolderAtom);
  const customWidth = useAtomValue(customWidthAtom);
  const useCustomWidth = useAtomValue(useCustomWidthAtom);

  const logit = useLogger();
  const { toast } = useToast();
  const t = useAtomValue(translationAtom);

  // HANDLERS
  const setExportType = (format: ImageFormat) => {
    setSaveImageAs(format);
  };

  const outputHandler = async () => {
    const path = await window.electron.invoke(ELECTRON_COMMANDS.SELECT_FOLDER);
    if (path !== null) {
      logit("🗂 Setting Output Path: ", path);
      setOutputPath(path);
    } else {
      setOutputPath(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsInputDragging(false);

    const file = event.dataTransfer.files[0];
    const path = file ? window.electron.getPathForFile(file) : "";
    if (path) void importDroppedPath(path);
  };

  useEffect(() => {
    themeChange(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!imagePath) {
      setFileSize(null);
      return;
    }

    const getFileSize = async () => {
      try {
        const size = await window.electron.invoke(
          ELECTRON_COMMANDS.GET_FILE_SIZE,
          imagePath,
        );

        if (typeof size === "number") return size;
      } catch {
        // The renderer can refresh before Electron restarts its main process.
      }

      const response = await fetch("file:///" + sanitizePath(imagePath));
      return (await response.blob()).size;
    };

    void getFileSize()
      .then((size) => {
        if (!cancelled) setFileSize(size);
      })
      .catch(() => {
        if (!cancelled) setFileSize(null);
      });

    return () => {
      cancelled = true;
    };
  }, [imagePath]);

  // const { upscayl: upscaylResolution } = useUpscaylResolution({
  //   dimensions,
  //   customWidth,
  //   useCustomWidth,
  //   doubleUpscayl,
  //   scale,
  // });

  return (
    <div className="animate-step-in animate flex h-full max-w-[320px] flex-col gap-4 overflow-x-hidden overflow-y-auto px-3 py-4">
      {/* STEP 1 */}
      <div className="animate-step-in flex flex-col gap-2">
        <div className="step-heading flex flex-row text-sm">
          <span className="w-fit rounded-lg bg-foreground/10 px-2 text-sm font-medium">
            Step 1 - {t("APP.FILE_SELECTION.SINGLE_MODE_TYPE")}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onDragEnter={(event) => {
                event.preventDefault();
                setIsInputDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsInputDragging(false);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className={cn(
                "flex h-40 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-4 text-center transition-colors",
                isInputDragging
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background/40 hover:border-primary/60 hover:bg-primary/5",
              )}
            >
              <CloudUpload className="size-10" strokeWidth={1.5} />
              <span className="text-sm font-medium">
                Drag & drop an image or folder
              </span>
              <span className="-mt-1 text-sm text-muted-foreground">
                or click to browse
              </span>
              <span className="mt-2 text-xs text-muted-foreground">
                PNG, JPG, JPEG, WEBP
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            <DropdownMenuItem onSelect={() => void selectImageHandler()}>
              <UploadIcon />
              {t("APP.FILE_SELECTION.TITLE")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void selectFolderHandler()}>
              <FolderIcon />
              {t("APP.FILE_SELECTION.BATCH_MODE_TYPE")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!batchMode && imagePath && (
          <div className="mt-2 flex items-start gap-2 rounded-2xl border bg-background/40 p-2">
            <img
              src={"file:///" + sanitizePath(imagePath)}
              alt=""
              className="size-16 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 space-y-1 text-xs">
              <p className="truncate font-medium">
                {getFilenameFromPath(imagePath)}
              </p>
              {dimensions.width && dimensions.height && (
                <p className="text-muted-foreground">
                  {dimensions.width} × {dimensions.height} px
                </p>
              )}
              {fileSize !== null && (
                <p className="text-muted-foreground">
                  {(fileSize / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* UPSCALE SETTINGS */}
      <div className="animate-step-in group flex flex-col gap-4">
        <div className="step-heading flex flex-row text-sm">
          <p className="w-fit rounded-lg bg-foreground/10 px-2 text-sm font-medium">
            Step 2 - Upscale Settings
          </p>
        </div>
        <div className="rounded-2xl border bg-background/40 p-3">
          <div className="flex flex-col gap-4">
            <SelectModelDialog />
            {!batchMode && (
              <FieldGroup>
                <FieldLabel htmlFor="double-upscayl-toggle">
                  <Field orientation="horizontal">
                    <FieldContent
                      data-tooltip-id="tooltip"
                      data-tooltip-content={t("APP.DOUBLE_UPSCAYL.DESCRIPTION")}
                    >
                      <FieldTitle>{t("APP.DOUBLE_UPSCAYL.TITLE")}</FieldTitle>
                      <FieldDescription className="line-clamp-2 max-w-58">
                        {t("APP.DOUBLE_UPSCAYL.DESCRIPTION")}
                      </FieldDescription>
                    </FieldContent>
                    <Switch
                      id="double-upscayl-toggle"
                      checked={doubleUpscayl}
                      onCheckedChange={(isChecked) => {
                        if (isChecked) setDoubleUpscayl(true);
                        else setDoubleUpscayl(false);
                      }}
                    />
                  </Field>
                </FieldLabel>
              </FieldGroup>
            )}
            <SelectImageScale scale={scale} setScale={setScale} hideInfo />

            {/* SAVE IMAGE AS */}
            <div className="flex flex-col gap-2">
              <span className="w-fit rounded-lg bg-foreground/10 px-2 text-sm font-medium">
                Save Image As
              </span>

              <SelectImageFormat
                batchMode={batchMode}
                saveImageAs={saveImageAs}
                setExportType={setExportType}
                hideLabel
              />
            </div>
          </div>
        </div>
      </div>

      {/* STEP 3 */}
      <div className="animate-step-in">
        <div className="flex flex-col pb-2">
          <div className="step-heading flex items-center gap-2">
            <span className="flex items-center justify-center self-start rounded-lg bg-foreground/10 px-2 text-sm font-medium">
              {t("APP.OUTPUT_PATH_SELECTION.TITLE")}
            </span>
            {FEATURE_FLAGS.APP_STORE_BUILD && (
              <button
                className="badge badge-outline badge-sm cursor-pointer"
                onClick={() =>
                  alert(t("APP.OUTPUT_PATH_SELECTION.MAC_APP_STORE_ALERT"))
                }
              >
                ?
              </button>
            )}
          </div>
          {!outputPath && FEATURE_FLAGS.APP_STORE_BUILD && (
            <div className="text-xs">
              <span className="rounded-btn bg-base-200 text-base-content/50 px-2 font-medium uppercase">
                {t("APP.OUTPUT_PATH_SELECTION.NOT_SELECTED")}
              </span>
            </div>
          )}
        </div>
        {!batchMode && !FEATURE_FLAGS.APP_STORE_BUILD && (
          <p className="mb-2 text-sm">
            {!batchMode
              ? t("APP.OUTPUT_PATH_SELECTION.DEFAULT_IMG_PATH")
              : t("APP.OUTPUT_PATH_SELECTION.DEFAULT_FOLDER_PATH")}
          </p>
        )}
        <Button
          variant="outline"
          className="w-full justify-start rounded-xl"
          data-tooltip-content={outputPath}
          data-tooltip-id="tooltip"
          onClick={outputHandler}
        >
          {t("APP.OUTPUT_PATH_SELECTION.BUTTON_TITLE")}
        </Button>
      </div>
      {/* STEP 4 */}
      <div className="animate-step-in flex h-full items-end">
        <p className="step-heading sr-only">{t("APP.SCALE_SELECTION.TITLE")}</p>
        {/* {dimensions.width && dimensions.height && ( */}
        {/*   <p className="mb-2 text-sm"> */}
        {/*     {t("APP.SCALE_SELECTION.FROM_TITLE")} */}
        {/*     <span className="font-bold"> */}
        {/*       {dimensions.width}x{dimensions.height} */}
        {/*     </span> */}
        {/*     {t("APP.SCALE_SELECTION.TO_TITLE")} */}
        {/*     <span className="font-bold"> */}
        {/*       {upscaylResolution.width}x{upscaylResolution.height} */}
        {/*     </span> */}
        {/*   </p> */}
        {/* )} */}
        <Button
          className="upscayl-button"
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const horizontalPosition =
              (event.clientX - bounds.left) / bounds.width - 0.5;
            const verticalPosition =
              (event.clientY - bounds.top) / bounds.height - 0.5;

            event.currentTarget.style.setProperty(
              "--glass-x",
              `${event.clientX - bounds.left}px`,
            );
            event.currentTarget.style.setProperty(
              "--glass-y",
              `${event.clientY - bounds.top}px`,
            );
            event.currentTarget.style.setProperty(
              "--tilt-x",
              `${verticalPosition * -8}deg`,
            );
            event.currentTarget.style.setProperty(
              "--tilt-y",
              `${horizontalPosition * 10}deg`,
            );
            event.currentTarget.style.setProperty(
              "--skew-x",
              `${horizontalPosition * -1.5}deg`,
            );
          }}
          onPointerLeave={(event) => {
            event.currentTarget.style.setProperty("--glass-x", "50%");
            event.currentTarget.style.setProperty("--glass-y", "50%");
            event.currentTarget.style.setProperty("--tilt-x", "0deg");
            event.currentTarget.style.setProperty("--tilt-y", "0deg");
            event.currentTarget.style.setProperty("--skew-x", "0deg");
          }}
          onClick={
            progress.length > 0 || !outputPath
              ? () =>
                  toast({
                    description: t(
                      "APP.SCALE_SELECTION.NO_OUTPUT_FOLDER_ALERT",
                    ),
                  })
              : upscaylHandler
          }
        >
          <SparklesIcon aria-hidden="true" />
          <span>
            {progress.length > 0
              ? t("APP.SCALE_SELECTION.IN_PROGRESS_BUTTON_TITLE")
              : t("APP.SCALE_SELECTION.START_BUTTON_TITLE")}
          </span>
        </Button>
      </div>
    </div>
  );
}

export default UpscaylSteps;
