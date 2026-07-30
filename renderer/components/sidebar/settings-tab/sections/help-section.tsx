import React from "react";
import { useAtomValue } from "jotai";
import { translationAtom } from "@/atoms/translations-atom";
import { Button } from "@/components/ui/button";
import { DonateButton } from "../donate-button";
import { FEATURE_FLAGS } from "@common/feature-flags";

interface IProps {
  logData: string[];
}

function HelpSection({ logData }: IProps) {
  const t = useAtomValue(translationAtom);

  return (
    <div className="flex flex-col gap-5">
      <div className="inline-flex items-center justify-between">
        <p className="text-sm font-medium uppercase">
          {t("Having issues?")}
        </p>
        <Button variant="outline" size="sm" className="min-w-28" asChild>
          <a href="https://docs.upscayl.org/" target="_blank">
            {t("🙏 GET HELP")}
          </a>
        </Button>
      </div>

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
          {t("📧 EMAIL DEVELOPER")}
        </button>
      )}

      {!FEATURE_FLAGS.APP_STORE_BUILD && <DonateButton />}
    </div>
  );
}

export default HelpSection;
