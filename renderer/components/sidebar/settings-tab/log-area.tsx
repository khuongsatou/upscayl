import { translationAtom } from "@/atoms/translations-atom";
import { Button } from "@/components/ui/button";
import { useAtomValue } from "jotai";
import React, { useEffect } from "react";

type LogAreaProps = {
  copyOnClickHandler: () => void;
  isCopied: boolean;
  logData: string[];
};

export function LogArea({
  copyOnClickHandler,
  isCopied,
  logData,
}: LogAreaProps) {
  const ref = React.useRef<HTMLElement>(null);
  const t = useAtomValue(translationAtom);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logData]);

  return (
    <div className="relative flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">LOGS</p>
        <Button size="xs" onClick={copyOnClickHandler}>
          {isCopied ? (
            <span>{t("SETTINGS.LOG_AREA.ON_COPY")}</span>
          ) : (
            <span>{t("SETTINGS.LOG_AREA.BUTTON_TITLE")}</span>
          )}
        </Button>
      </div>
      <code
        className="relative flex h-52 max-h-52 flex-col gap-3 overflow-y-auto rounded-3xl border bg-secondary p-4 text-xs break-all"
        ref={ref}
      >
        {logData.length === 0 && (
          <p className="text-base-content/70">
            {t("SETTINGS.LOG_AREA.NO_LOGS")}
          </p>
        )}

        {logData.map((logLine: any) => {
          return <p className="">{logLine}</p>;
        })}
      </code>
    </div>
  );
}
