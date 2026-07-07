"use client";
import useLogger from "../hooks/use-logger";
import { useState, useMemo, useEffect, useId } from "react";
import { ELECTRON_COMMANDS } from "@common/electron-commands";
import { useAtom, useAtomValue } from "jotai";
import {
  batchModeAtom,
  lensSizeAtom,
  savedOutputPathAtom,
  progressAtom,
  viewTypeAtom,
  rememberOutputFolderAtom,
  scaleAtom,
  customWidthAtom,
  useCustomWidthAtom,
  doubleUpscaylAtom,
} from "../../atoms/user-settings-atom";
import { useToast } from "@/components/ui/use-toast";
import { sanitizePath } from "@common/sanitize-path";
import getDirectoryFromPath from "@common/get-directory-from-path";
import { FEATURE_FLAGS } from "@common/feature-flags";
import { ImageFormat, VALID_IMAGE_FORMATS } from "@/lib/valid-formats";
import ProgressBar from "./progress-bar";
import InstructionsCard from "./instructions-card";
import useUpscaylVersion from "../hooks/use-upscayl-version";
import MacTitlebarDragRegion from "./mac-titlebar-drag-region";
import LensViewer from "./lens-view";
import ImageViewer from "./image-viewer";
import useTranslation from "../hooks/use-translation";
import SliderView from "./slider-view";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  ArrowRightIcon,
  ChevronDown,
  FolderOpenIcon,
  LoaderCircle,
  TriangleAlertIcon,
} from "lucide-react";
import useUpscaylResolution from "../hooks/use-upscayl-resolution";
import getFilenameFromPath from "@common/get-file-name";
import getBaseFileName from "@common/get-base-file-name";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import ToolBar from "./toolbar";

type MainContentProps = {
  imagePath: string;
  resetImagePaths: () => void;
  upscaledBatchFolderPath: string;
  setUpscaledBatchFolderPath: React.Dispatch<React.SetStateAction<string>>;
  setImagePath: React.Dispatch<React.SetStateAction<string>>;
  validateImagePath: (path: string) => void;
  selectFolderHandler: () => void;
  selectImageHandler: () => void;
  upscaledImagePath: string;
  batchFolderPath: string;
  setBatchFolderPath: React.Dispatch<React.SetStateAction<string>>;
  dimensions: Record<"width" | "height", number | null>;
  doubleUpscaylCounter: number;
  setDimensions: React.Dispatch<
    React.SetStateAction<{
      width: number;
      height: number;
    }>
  >;
};

const MainContent = ({
  imagePath,
  resetImagePaths,
  upscaledBatchFolderPath,
  setUpscaledBatchFolderPath,
  setImagePath,
  validateImagePath,
  selectFolderHandler,
  selectImageHandler,
  upscaledImagePath,
  batchFolderPath,
  setBatchFolderPath,
  dimensions,
  doubleUpscaylCounter,
  setDimensions,
}: MainContentProps) => {
  const componentId = useId();
  const t = useTranslation();
  const logit = useLogger();
  const { toast } = useToast();
  const version = useUpscaylVersion();

  const [outputPath, setOutputPath] = useAtom(savedOutputPathAtom);
  const progress = useAtomValue(progressAtom);
  const batchMode = useAtomValue(batchModeAtom);

  const viewType = useAtomValue(viewTypeAtom);
  const lensSize = useAtomValue(lensSizeAtom);
  const rememberOutputFolder = useAtomValue(rememberOutputFolderAtom);
  const [zoomAmount, setZoomAmount] = useState("100");
  const [maximize, setMaximize] = useState(false);

  const [batchImagePaths, setBatchImagePaths] = useState<string[]>([]);
  const [upscayledBatchImagePaths, setUpscayledBatchImagePaths] = useState<
    string[]
  >([]);
  const [selectedBatchImage, setSelectedBatchImage] = useState("");
  const [selectedUpscayldBatchImage, setUpscayledSelectedBatchImage] =
    useState("");

  const scale = useAtomValue(scaleAtom);
  const customWidth = useAtomValue(customWidthAtom);
  const useCustomWidth = useAtomValue(useCustomWidthAtom);
  const doubleUpscayl = useAtomValue(doubleUpscaylAtom);

  const upscaylResolution = useUpscaylResolution({
    dimensions,
    customWidth,
    useCustomWidth,
    doubleUpscayl,
    scale,
  });

  const sanitizedUpscaledImagePath = useMemo(
    () => sanitizePath(upscaledImagePath),
    [upscaledImagePath],
  );

  const showInformationCard = useMemo(() => {
    if (!batchMode) {
      return imagePath.length === 0 && upscaledImagePath.length === 0;
    } else {
      return (
        batchFolderPath.length === 0 && upscaledBatchFolderPath.length === 0
      );
    }
  }, [
    batchMode,
    imagePath,
    upscaledImagePath,
    batchFolderPath,
    upscaledBatchFolderPath,
  ]);

  // BATCH MODE HANDLERS
  const resetBatchFolderPath = () => {
    setUpscaledBatchFolderPath("");
    setSelectedBatchImage("");
    setBatchFolderPath("");
    setBatchImagePaths([]);
  };

  // DRAG AND DROP HANDLERS
  const handleDragEnter = (e) => {
    e.preventDefault();
    console.log("drag enter");
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    console.log("drag leave");
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    console.log("drag over");
  };

  const openFolderHandler = (e) => {
    const logit = useLogger();
    logit("📂 OPEN_FOLDER: ", upscaledBatchFolderPath);
    window.electron.send(
      ELECTRON_COMMANDS.OPEN_FOLDER,
      upscaledBatchFolderPath,
    );
  };

  const sanitizedImagePath = useMemo(
    () => sanitizePath(imagePath),
    [imagePath],
  );

  const handleDrop = (e) => {
    e.preventDefault();
    resetImagePaths();
    if (
      e.dataTransfer.items.length === 0 ||
      e.dataTransfer.files.length === 0
    ) {
      logit("👎 No valid files dropped");
      toast({
        title: t("ERRORS.INVALID_IMAGE_ERROR.TITLE"),
        description: t("ERRORS.INVALID_IMAGE_ERROR.ADDITIONAL_DESCRIPTION"),
      });
      return;
    }
    const type = e.dataTransfer.items[0].type;
    const filePath = e.dataTransfer.files[0].path;
    const extension = e.dataTransfer.files[0].name.split(".").at(-1);
    logit("⤵️ Dropped file: ", JSON.stringify({ type, filePath, extension }));
    if (
      !type.includes("image") ||
      !VALID_IMAGE_FORMATS.includes(extension.toLowerCase())
    ) {
      logit("🚫 Invalid file dropped");
      toast({
        title: t("ERRORS.INVALID_IMAGE_ERROR.TITLE"),
        description: t("ERRORS.INVALID_IMAGE_ERROR.ADDITIONAL_DESCRIPTION"),
      });
    } else {
      logit("🖼 Setting image path: ", filePath);
      setImagePath(filePath);
      const dirname = getDirectoryFromPath(filePath);
      logit("🗂 Setting output path: ", dirname);
      if (!FEATURE_FLAGS.APP_STORE_BUILD) {
        if (!rememberOutputFolder) {
          setOutputPath(dirname);
        }
      }
      validateImagePath(filePath);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (outputPath) {
      resetImagePaths();
      if (e.clipboardData.files.length) {
        const fileObject = e.clipboardData.files[0];
        const currentDate = new Date(Date.now());
        const currentTime = `${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;
        const fileName = `.temp-${currentTime}-${fileObject.name || "image"}`;
        const file = {
          name: fileName,
          path: outputPath,
          extension: fileName.split(".").pop() as ImageFormat,
          size: fileObject.size,
          type: fileObject.type.split("/")[0],
          encodedBuffer: "",
        };

        logit(
          "📋 Pasted file: ",
          JSON.stringify({
            name: file.name,
            path: file.path,
            extension: file.extension,
          }),
        );

        if (
          file.type === "image" &&
          VALID_IMAGE_FORMATS.includes(file.extension)
        ) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const result = event.target?.result;
            if (typeof result === "string") {
              file.encodedBuffer = Buffer.from(result, "utf-8").toString(
                "base64",
              );
            } else if (result instanceof ArrayBuffer) {
              file.encodedBuffer = Buffer.from(new Uint8Array(result)).toString(
                "base64",
              );
            } else {
              logit("🚫 Invalid file pasted");
              toast({
                title: t("ERRORS.INVALID_IMAGE_ERROR.TITLE"),
                description: t(
                  "ERRORS.INVALID_IMAGE_ERROR.CLIPBOARD_DESCRIPTION",
                ),
              });
            }
            window.electron.send(ELECTRON_COMMANDS.PASTE_IMAGE, file);
          };
          reader.readAsArrayBuffer(fileObject);
        } else {
          logit("🚫 Invalid file pasted");
          toast({
            title: t("ERRORS.INVALID_IMAGE_ERROR.TITLE"),
            description: t("ERRORS.INVALID_IMAGE_ERROR.CLIPBOARD_DESCRIPTION"),
          });
        }
      } else {
        logit("🚫 Invalid file pasted");
        toast({
          title: t("ERRORS.INVALID_IMAGE_ERROR.TITLE"),
          description: t("ERRORS.INVALID_IMAGE_ERROR.CLIPBOARD_DESCRIPTION"),
        });
      }
    } else {
      toast({
        title: t("ERRORS.NO_OUTPUT_FOLDER_ERROR.TITLE"),
        description: t("ERRORS.NO_OUTPUT_FOLDER_ERROR.DESCRIPTION"),
      });
    }
  };

  useEffect(() => {
    // Events
    const handlePasteEvent = (e) => handlePaste(e);
    const handlePasteImageSaveSuccess = (_: any, imageFilePath: string) => {
      setImagePath(imageFilePath);
      validateImagePath(imageFilePath);
    };
    const handlePasteImageSaveError = (_: any, error: string) => {
      toast({
        title: t("ERRORS.NO_IMAGE_ERROR.TITLE"),
        description: error,
      });
    };
    window.addEventListener("paste", handlePasteEvent);
    window.electron.on(
      ELECTRON_COMMANDS.PASTE_IMAGE_SAVE_SUCCESS,
      handlePasteImageSaveSuccess,
    );
    window.electron.on(
      ELECTRON_COMMANDS.PASTE_IMAGE_SAVE_ERROR,
      handlePasteImageSaveError,
    );
    return () => {
      window.removeEventListener("paste", handlePasteEvent);
    };
  }, [t, outputPath]);

  // Get image paths within batch folder
  useEffect(() => {
    window.electron.on(
      ELECTRON_COMMANDS.IMAGE_FILES_LIST,
      (_, { images, folderPath }) => {
        if (folderPath !== batchFolderPath) return;

        if (images?.[0].length > 0) setSelectedBatchImage(images[0]);
        setBatchImagePaths(images);
      },
    );

    if (batchFolderPath.length > 0) {
      window.electron.send(ELECTRON_COMMANDS.GET_IMAGE_PATHS, batchFolderPath);
    }
  }, [batchFolderPath]);

  useEffect(() => {
    if (!batchMode) return;

    window.electron.on(
      ELECTRON_COMMANDS.IMAGE_FILES_LIST,
      (_, { images, folderPath }) => {
        if (folderPath !== upscaledBatchFolderPath) return;
        if (!images || images.length === 0) return;

        setUpscayledBatchImagePaths(images);

        // Try to keep the upscayled preview in sync with whatever's selected in the
        // original slider. Fall back to the first matching pair if the current
        // selection has no upscayled counterpart yet.
        const selectedBaseName = getBaseFileName(
          getFilenameFromPath(selectedBatchImage),
        );

        const matchForSelected = selectedBaseName
          ? (images as string[]).find(
              (img) =>
                getBaseFileName(getFilenameFromPath(img)) === selectedBaseName,
            )
          : null;

        if (matchForSelected) setUpscayledSelectedBatchImage(matchForSelected);

        // TODO: Handle failed upscayls — right now a failed image just won't have a
        // matching entry in `images`, so selection can silently fall out of sync.
        // Detect that case and re-sync selectedBatchImage <-> upscayledSelectedBatchImage
        // (or skip to the next successfully upscayled image) instead of leaving stale state.
      },
    );

    if (upscaledBatchFolderPath.length > 0) {
      window.electron.send(
        ELECTRON_COMMANDS.GET_IMAGE_PATHS,
        upscaledBatchFolderPath,
      );
    }
  }, [upscaledBatchFolderPath, selectedBatchImage]);

  useEffect(() => {
    if (!batchMode) {
      resetBatchFolderPath();
    } else if (batchMode && batchImagePaths.length > 0) {
      resetImagePaths();
    }
  }, [batchMode]);

  // Merge original + upscayled image paths by matching base filename
  const batchImageFiles = useMemo(() => {
    const upscaylDone =
      upscayledBatchImagePaths.length === batchImagePaths.length;

    return batchImagePaths.map((image) => {
      const baseName = getBaseFileName(getFilenameFromPath(image));
      const upscayledImage = upscayledBatchImagePaths.find(
        (u) => getBaseFileName(getFilenameFromPath(u)) === baseName,
      );

      return {
        image,
        upscayledImage: upscayledImage ?? null,
        isUpscayled: Boolean(upscayledImage),
        disabled: upscaylDone && !upscayledImage,
      };
    });
  }, [batchImagePaths, upscayledBatchImagePaths]);

  useEffect(() => {
    if (!localStorage.getItem("zoomAmount")) {
      localStorage.setItem("zoomAmount", zoomAmount);
    } else {
      setZoomAmount(localStorage.getItem("zoomAmount"));
    }
  }, []);

  return (
    <div
      className={cn(
        "flex size-full flex-col items-center justify-center gap-2",
        { relative: !maximize },
      )}
    >
      <MacTitlebarDragRegion />

      {/* <MoreOptionsDrawer */}
      {/*   zoomAmount={zoomAmount} */}
      {/*   setZoomAmount={setZoomAmount} */}
      {/*   resetImagePaths={resetImagePaths} */}
      {/* /> */}

      <div className="flex size-full gap-2 overflow-hidden">
        <div className="flex h-full w-full flex-col gap-2 overflow-hidden rounded-4xl border bg-accent p-2">
          {(selectedBatchImage.length > 0 || imagePath.length > 0) && (
            <div className="inline-flex items-center justify-between gap-8">
              <div className="space-y-1.5 px-1.5 text-sm">
                <p className="line-clamp-1 w-full font-semibold">
                  {selectedBatchImage.length > 0
                    ? getFilenameFromPath(selectedBatchImage)
                    : getFilenameFromPath(imagePath)}
                </p>
                {!batchMode && imagePath.length > 0 && (
                  <div className="inline-flex items-center gap-1 text-muted-foreground">
                    <span>{`${dimensions.width}x${dimensions.height}`}</span>
                    <ArrowRightIcon size={16} />
                    {parseInt(scale) >= 6 && (
                      <TriangleAlertIcon
                        size={18}
                        className="fill-yellow-500 stroke-black"
                        data-tooltip-id="tooltip"
                        data-tooltip-content={t("SETTINGS.IMAGE_SCALE.WARNING")}
                      />
                    )}
                    <span>{`${upscaylResolution.width}x${upscaylResolution.height} (${scale}x)`}</span>
                  </div>
                )}
              </div>
              <Popover>
                <PopoverTrigger disabled={viewType === "lens"} asChild>
                  <Button variant="outline">
                    <span>Zoom</span>
                    <span className="ml-3">{zoomAmount}%</span>
                    <ChevronDown />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step={10}
                    className="range range-md"
                    value={parseInt(zoomAmount)}
                    onChange={(e) => {
                      setZoomAmount(e.target.value);
                      localStorage.setItem("zoomAmount", e.target.value);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* BATCH UPSCALE DONE INFO */}
          {/* {batchMode && upscaledBatchFolderPath.length > 0 && ( */}
          {/*   <div className="z-50 flex flex-col items-center"> */}
          {/*     <p className="text-base-content py-4 font-bold select-none"> */}
          {/*       {t("APP.PROGRESS.BATCH.DONE_TITLE")} */}
          {/*     </p> */}
          {/*     <button */}
          {/*       className="bg-gradient-blue btn btn-primary rounded-btn p-3 font-medium text-white/90 transition-colors" */}
          {/*       onClick={openFolderHandler} */}
          {/*     > */}
          {/*       {t("APP.PROGRESS.BATCH.OPEN_UPSCAYLED_FOLDER_TITLE")} */}
          {/*     </button> */}
          {/*   </div> */}
          {/* )} */}

          {/* DEFAULT PANE INFO */}
          {showInformationCard && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDoubleClick={
                batchMode ? selectFolderHandler : selectImageHandler
              }
              className="size-full"
            >
              <InstructionsCard version={version} batchMode={batchMode} />
            </div>
          )}

          <div
            className={cn(maximize ? "absolute inset-0 z-10" : "relative", {
              "h-full overflow-hidden rounded-3xl border bg-card": !batchMode
                ? imagePath.length > 0 || upscaledImagePath.length > 0
                : batchFolderPath.length > 0 && batchImagePaths.length > 0,
            })}
          >
            <ToolBar
              zoomAmount={zoomAmount}
              setZoomAmount={setZoomAmount}
              resetImagePaths={resetImagePaths}
              maximize={maximize}
              setMaximize={setMaximize}
              hasImage={imagePath.length > 0 || selectedBatchImage.length > 0}
              hasUpscayledImage={
                sanitizedUpscaledImagePath.length > 0 ||
                selectedUpscayldBatchImage.length > 0
              }
            />

            {/* BATCH UPSCALE SHOW SELECTED FOLDER */}
            {selectedBatchImage.length > 0 &&
              upscaledBatchFolderPath.length === 0 &&
              batchFolderPath.length > 0 && (
                <ImageViewer
                  imagePath={selectedBatchImage}
                  setDimensions={setDimensions}
                />
              )}

            {/* SHOW SELECTED IMAGE */}
            {!batchMode &&
              upscaledImagePath.length === 0 &&
              imagePath.length > 0 && (
                <ImageViewer
                  imagePath={imagePath}
                  setDimensions={setDimensions}
                />
              )}

            {/* COMPARISON SLIDER */}
            {!batchMode &&
              viewType === "slider" &&
              imagePath.length > 0 &&
              upscaledImagePath.length > 0 && (
                <SliderView
                  sanitizedImagePath={sanitizedImagePath}
                  sanitizedUpscaledImagePath={sanitizedUpscaledImagePath}
                  zoomAmount={zoomAmount}
                  beforeSize={`${dimensions.width} x ${dimensions.height}`}
                  afterSize={`${upscaylResolution.width} x ${upscaylResolution.height}`}
                  isMaximized={maximize}
                  scale={scale}
                />
              )}

            {/* BATCH COMPARISON SLIDER */}
            {batchMode &&
              viewType === "slider" &&
              selectedBatchImage.length > 0 &&
              selectedUpscayldBatchImage.length > 0 && (
                <SliderView
                  sanitizedImagePath={sanitizePath(selectedBatchImage)}
                  sanitizedUpscaledImagePath={sanitizePath(
                    selectedUpscayldBatchImage,
                  )}
                  zoomAmount={zoomAmount}
                  beforeSize={""}
                  afterSize={""}
                  isMaximized={maximize}
                  scale={""}
                />
              )}

            {progress.length > 0 &&
              upscaledImagePath.length === 0 &&
              upscaledBatchFolderPath.length === 0 && (
                <ProgressBar
                  batchMode={batchMode}
                  progress={progress}
                  doubleUpscaylCounter={doubleUpscaylCounter}
                  resetImagePaths={resetImagePaths}
                />
              )}

            {!batchMode &&
              viewType === "lens" &&
              upscaledImagePath &&
              imagePath && (
                <LensViewer
                  sanitizedImagePath={sanitizedImagePath}
                  sanitizedUpscaledImagePath={sanitizedUpscaledImagePath}
                />
              )}

            {batchMode &&
              viewType === "lens" &&
              selectedBatchImage.length > 0 &&
              selectedUpscayldBatchImage.length > 0 && (
                <LensViewer
                  sanitizedImagePath={sanitizePath(selectedBatchImage)}
                  sanitizedUpscaledImagePath={sanitizePath(
                    selectedUpscayldBatchImage,
                  )}
                />
              )}
          </div>
        </div>

        {batchFolderPath.length > 0 && batchImagePaths.length > 0 && (
          <div className="flex w-72 shrink-0 flex-col gap-3 rounded-4xl border bg-accent p-4">
            <div className="inline-flex items-center justify-between">
              <p className="text-sm font-medium">
                Batch Queue {batchImagePaths.length}
              </p>
              <Button variant="ghost" onClick={resetBatchFolderPath}>
                Clear All
              </Button>
            </div>
            <div className="h-full w-full gap-2 space-y-3 overflow-y-auto">
              {batchImageFiles.map((batch, index) => {
                return (
                  <div
                    key={`${componentId}-${index}`}
                    aria-disabled={batch.disabled}
                    onClick={(e) => {
                      e.preventDefault();
                      if (batch.disabled || progress.length > 0) return;

                      setSelectedBatchImage(batch.image);

                      if (batch.isUpscayled && batch.upscayledImage) {
                        setUpscayledSelectedBatchImage(batch.upscayledImage);
                      }
                    }}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-2xl transition-all duration-200 ease-out",
                      batch.disabled
                        ? "cursor-not-allowed opacity-40 grayscale"
                        : "cursor-pointer",
                    )}
                  >
                    {progress.length > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <LoaderCircle className="animate-spin" />
                      </div>
                    )}
                    <ImageViewer
                      imagePath={batch.image}
                      setDimensions={setDimensions}
                      className="object-cover"
                    />
                  </div>
                );
              })}
            </div>
            {batchMode && upscaledBatchFolderPath.length > 0 && (
              <div className="flex w-full flex-col items-center justify-center gap-3">
                <p className="sr-only">{t("APP.PROGRESS.BATCH.DONE_TITLE")}</p>
                <Button onClick={openFolderHandler}>
                  <FolderOpenIcon />
                  {t("APP.PROGRESS.BATCH.OPEN_UPSCAYLED_FOLDER_TITLE")}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainContent;
