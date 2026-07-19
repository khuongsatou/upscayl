import React from "react";
import TurnOffNotificationsToggle from "../turn-off-notifications-toggle";
import AutoUpdateToggle from "../auto-update-toggle";
import EnableContributionToggle from "../enable-contributions-toggle";
import { ResetSettingsButton } from "../reset-settings-button";
import SystemInfo from "../system-info";
import { FEATURE_FLAGS } from "@common/feature-flags";
import { UpscaylCloudModal } from "@/components/upscayl-cloud-modal";
import { useAtomValue } from "jotai";
import { translationAtom } from "@/atoms/translations-atom";

interface IProps {
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  setDontShowCloudModal: React.Dispatch<React.SetStateAction<boolean>>;
}

function SystemSection({ show, setShow, setDontShowCloudModal }: IProps) {
  const t = useAtomValue(translationAtom);

  return (
    <div className="flex flex-col gap-5">
      <TurnOffNotificationsToggle />
      <AutoUpdateToggle />
      <EnableContributionToggle />

      <hr />

      <ResetSettingsButton />

      <hr />

      {FEATURE_FLAGS.SHOW_UPSCAYL_CLOUD_INFO && (
        <>
          <button
            className="rounded-btn bg-success shadow-success/40 animate-pulse p-1 text-sm text-slate-50 shadow-lg"
            onClick={() => setShow(true)}
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
  );
}

export default SystemSection;
