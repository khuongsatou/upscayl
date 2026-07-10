import { useAtom, useAtomValue } from "jotai";
import React, { useEffect } from "react";
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
import { FolderIcon, SparklesIcon, UploadIcon } from "lucide-react";
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

interface IProps {
  selectImageHandler: () => Promise<void>;
  selectFolderHandler: () => Promise<void>;
  upscaylHandler: () => Promise<void>;
  batchMode: boolean;
  setBatchMode: React.Dispatch<React.SetStateAction<boolean>>;
  imagePath: string;
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
  upscaylHandler,
  batchMode,
  setBatchMode,
  imagePath,
  doubleUpscayl,
  setDoubleUpscayl,
  dimensions,
}: IProps) {
  const [scale, setScale] = useAtom(scaleAtom);
  const [outputPath, setOutputPath] = useAtom(savedOutputPathAtom);
  const [progress, setProgress] = useAtom(progressAtom);
  const [saveImageAs, setSaveImageAs] = useAtom(saveImageAsAtom);
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

  useEffect(() => {
    themeChange(false);
  }, []);

  // const { upscayl: upscaylResolution } = useUpscaylResolution({
  //   dimensions,
  //   customWidth,
  //   useCustomWidth,
  //   doubleUpscayl,
  //   scale,
  // });

  return (
    <div className="animate-step-in animate flex h-full max-w-[320px] flex-col gap-7 overflow-x-hidden overflow-y-auto p-5">
      {/* STEP 1 */}
      <div className="animate-step-in">
        <div className="step-heading flex flex-col text-sm">
          <span className="flex items-center justify-center self-start rounded-lg bg-foreground/10 px-2 text-sm font-medium">
            Step 1
          </span>
          <p>{t("APP.FILE_SELECTION.SINGLE_MODE_TYPE")}</p>
        </div>
        <div className="flex flex-col gap-2 [&_svg]:size-4.5!">
          <Button
            className="h-16 gap-2"
            onClick={selectImageHandler}
            data-tooltip-id="tooltip"
            data-tooltip-content={imagePath}
          >
            <UploadIcon />
            <div className="flex flex-col text-start">
              <span className="font-semibold">
                {t("APP.FILE_SELECTION.TITLE")}
              </span>
              <span className="text-primary-foreground/50">PNG, JPG, WEBP</span>
            </div>
            <p></p>
          </Button>
          <Button
            variant="outline"
            className="h-16 font-semibold"
            onClick={selectFolderHandler}
          >
            <FolderIcon />
            {t("APP.FILE_SELECTION.BATCH_MODE_TYPE")}
          </Button>
        </div>
      </div>

      {/* STEP 2 */}
      <div className="animate-step-in group flex flex-col gap-4">
        <div className="flex flex-col gap-1 text-sm">
          <p className="flex items-center justify-center self-start rounded-lg bg-foreground/10 px-2 text-sm font-medium">
            {t("APP.MODEL_SELECTION.TITLE")}
          </p>
          <p>{t("APP.MODEL_SELECTION.DESCRIPTION")}</p>

          <SelectModelDialog />
        </div>

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

        {/* IMAGE FORMAT BUTTONS */}
        <div className="space-y-1">
          <p className="capitalize">
            {t("SETTINGS.IMAGE_FORMAT.TITLE").toLowerCase()}
          </p>
          <SelectImageFormat
            batchMode={batchMode}
            saveImageAs={saveImageAs}
            setExportType={setExportType}
            hideLabel
          />
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
          className="h-14 w-full bg-linear-to-r bg-[linear-gradient(120deg,#fde68a_20%,#f472b6,#a78bfa,#bae6fd)]"
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
          {progress.length > 0
            ? t("APP.SCALE_SELECTION.IN_PROGRESS_BUTTON_TITLE")
            : t("APP.SCALE_SELECTION.START_BUTTON_TITLE")}
        </Button>
      </div>
    </div>
  );
}

export default UpscaylSteps;
