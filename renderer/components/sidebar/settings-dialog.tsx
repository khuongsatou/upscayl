import { translationAtom } from "@/atoms/translations-atom";
import { customModelsPathAtom, scaleAtom } from "@/atoms/user-settings-atom";
import { cn } from "@/lib/utils";
import { ImageFormat } from "@/lib/valid-formats";
import { FEATURE_FLAGS } from "@common/feature-flags";
import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";
import { UpscaylCloudModal } from "../upscayl-cloud-modal";
import AutoUpdateToggle from "./settings-tab/auto-update-toggle";
import CopyMetadataToggle from "./settings-tab/copy-metadata-toggle";
import { DonateButton } from "./settings-tab/donate-button";
import EnableContributionToggle from "./settings-tab/enable-contributions-toggle";
import { InputCompression } from "./settings-tab/input-compression";
import { InputCustomResolution } from "./settings-tab/input-custom-resolution";
import { InputGpuId } from "./settings-tab/input-gpu-id";
import { InputTileSize } from "./settings-tab/input-tile-size";
import LanguageSwitcher from "./settings-tab/language-switcher";
import { LogArea } from "./settings-tab/log-area";
import OverwriteToggle from "./settings-tab/overwrite-toggle";
import { ResetSettingsButton } from "./settings-tab/reset-settings-button";
import { SaveOutputFolderToggle } from "./settings-tab/save-output-folder-toggle";
import { CustomModelsFolderSelect } from "./settings-tab/select-custom-models-folder";
import { SelectImageFormat } from "./settings-tab/select-image-format";
import { SelectImageScale } from "./settings-tab/select-image-scale";
import SelectTheme from "./settings-tab/select-theme";
import SystemInfo from "./settings-tab/system-info";
import TTAModeToggle from "./settings-tab/tta-mode-toggle";
import TurnOffNotificationsToggle from "./settings-tab/turn-off-notifications-toggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface IProps {
  batchMode: boolean;
  saveImageAs: ImageFormat;
  setSaveImageAs: React.Dispatch<React.SetStateAction<ImageFormat>>;
  compression: number;
  setCompression: React.Dispatch<React.SetStateAction<number>>;
  gpuId: string;
  setGpuId: React.Dispatch<React.SetStateAction<string>>;
  logData: string[];
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  setDontShowCloudModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SettingsDialog({
  batchMode,
  compression,
  setCompression,
  gpuId,
  setGpuId,
  saveImageAs,
  setSaveImageAs,
  logData,
  show,
  setShow,
  setDontShowCloudModal,
}: IProps) {
  const [isCopied, setIsCopied] = useState(false);

  const [customModelsPath, setCustomModelsPath] = useAtom(customModelsPathAtom);
  const [scale, setScale] = useAtom(scaleAtom);
  const [enableScrollbar, setEnableScrollbar] = useState(true);
  const [timeoutId, setTimeoutId] = useState(null);
  const t = useAtomValue(translationAtom);

  // HANDLERS
  const setExportType = (format: ImageFormat) => {
    setSaveImageAs(format);
  };

  const handleCompressionChange = (e) => {
    setCompression(e.target.value);
  };

  const handleGpuIdChange = (e) => {
    setGpuId(e.target.value);
    localStorage.setItem("gpuId", e.target.value);
  };

  const copyOnClickHandler = () => {
    navigator.clipboard.writeText(logData.join("\n"));
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const sendToTermbin = async (logData: string[]) => {
    try {
      const response = await fetch("https://termbin.com:9999/", {
        method: "POST",
        body: logData.join("\n"),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const url = await response.text();
      return url.trim();
    } catch (error) {
      console.error("Error sending to termbin:", error);
      throw error;
    }
  };

  const upscaylVersion = navigator?.userAgent?.match(
    /Upscayl\/([\d\.]+\d+)/,
  )[1];

  function disableScrolling() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    setTimeoutId(
      setTimeout(function () {
        setEnableScrollbar(false);
      }, 1000),
    );
  }

  function enableScrolling() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    setEnableScrollbar(true);
  }

  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent className="md:max-h-125 md:max-w-175 lg:max-w-200">
        <DialogHeader className="h-8 border-b">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="h-100 overflow-hidden">
          <div
            className={cn(
              "animate-step-in animate z-50 flex h-full flex-col gap-7 overflow-x-hidden",
              enableScrollbar ? "" : "hide-scrollbar",
            )}
            onScroll={() => {
              if (enableScrollbar) disableScrolling();
            }}
            onWheel={() => {
              enableScrolling();
            }}
          >
            <div className="flex flex-col gap-2 text-sm font-medium uppercase">
              <p>{t("SETTINGS.SUPPORT.TITLE")}</p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://docs.upscayl.org/" target="_blank">
                  {t("SETTINGS.SUPPORT.DOCS_BUTTON_TITLE")}
                </a>
              </Button>
              {FEATURE_FLAGS.APP_STORE_BUILD && (
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    const systemInfo = await window.electron.getSystemInfo();
                    const appVersion = await window.electron.getAppVersion();
                    const mailToUrl = `mailto:support@upscayl.org?subject=Upscayl%20Issue%3A%20%3CWRITE%20HERE%3E&body=Hi%20Nayam!%0AI'm%20having%20an%20issue%20with%20Upscayl%20${appVersion}%0A%0A%3CPLEASE%20DESCRIBE%20ISSUE%20HERE%3E%0A%0A---%0ALOGS%3A%0A${logData.join("\n")}%0A%0ADEVICE%20DETAILS%3A%20${JSON.stringify(systemInfo)}`;
                    window.open(mailToUrl, "_blank");
                  }}
                >
                  {t("SETTINGS.SUPPORT.EMAIL_BUTTON_TITLE")}
                </button>
              )}
              {!FEATURE_FLAGS.APP_STORE_BUILD && <DonateButton />}
            </div>

            <LogArea
              copyOnClickHandler={copyOnClickHandler}
              isCopied={isCopied}
              logData={logData}
            />

            {/* THEME SELECTOR */}
            <SelectTheme />

            <LanguageSwitcher />

            {/* IMAGE FORMAT BUTTONS */}
            <SelectImageFormat
              batchMode={batchMode}
              saveImageAs={saveImageAs}
              setExportType={setExportType}
            />

            {/* COPY METADATA TOGGLE */}
            <CopyMetadataToggle
              saveImageAs={saveImageAs}
              setExportType={setExportType}
            />

            {/* IMAGE SCALE */}
            <SelectImageScale scale={scale} setScale={setScale} />

            <InputCustomResolution />

            <InputCompression
              compression={compression}
              handleCompressionChange={handleCompressionChange}
            />

            <SaveOutputFolderToggle />

            <OverwriteToggle />
            <TurnOffNotificationsToggle />
            <AutoUpdateToggle />
            <EnableContributionToggle />

            {/* GPU ID INPUT */}
            <InputGpuId gpuId={gpuId} handleGpuIdChange={handleGpuIdChange} />

            <InputTileSize />

            {/* CUSTOM MODEL */}
            <CustomModelsFolderSelect
              customModelsPath={customModelsPath}
              setCustomModelsPath={setCustomModelsPath}
            />

            <TTAModeToggle />

            {/* RESET SETTINGS */}
            <ResetSettingsButton />

            {FEATURE_FLAGS.SHOW_UPSCAYL_CLOUD_INFO && (
              <>
                <button
                  className="rounded-btn bg-success shadow-success/40 mx-5 mb-5 animate-pulse p-1 text-sm text-slate-50 shadow-lg"
                  onClick={() => {
                    setShow(true);
                  }}
                >
                  {t("INTRO")}
                </button>

                <UpscaylCloudModal
                  show={show}
                  setShow={setShow}
                  setDontShowCloudModal={setDontShowCloudModal}
                />
              </>
            )}

            <SystemInfo />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
