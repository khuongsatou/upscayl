import { FEATURE_FLAGS } from "@common/feature-flags";
import UpscaylSVGLogo from "@/components/icons/upscayl-logo-svg";
import { useAtomValue } from "jotai";
import { translationAtom } from "@/atoms/translations-atom";

export default function Header({ version }: { version: string }) {
  const t = useAtomValue(translationAtom);

  return (
    <a
      href="https://github.com/upscayl/upscayl"
      target="_blank"
      className={`outline-none focus-visible:ring-2`}
      data-tooltip-id="tooltip"
      data-tooltip-content={t("HEADER.GITHUB_BUTTON_TITLE")}
    >
      <div className="flex gap-2">
        <img src="/logo.svg" className="size-12" />

        <div className="flex flex-col items-start justify-start">
          <h1 className="text-lg text-medium text-foreground/80">{t("TITLE")} </h1>
          <p className="text-xs text-muted-foreground">
            {version} {FEATURE_FLAGS.APP_STORE_BUILD && "Mac"}
          </p>
        </div>
        
      </div>
    </a>
  );
}
