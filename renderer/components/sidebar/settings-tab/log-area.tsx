import { translationAtom } from "@/atoms/translations-atom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAtomValue } from "jotai";
import React, { useEffect, useRef } from "react";

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
  const bottomRef = useRef<HTMLParagraphElement>(null);
  const t = useAtomValue(translationAtom);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
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
      <ScrollArea className="h-52 rounded-3xl border bg-secondary">
        <code className="flex flex-col gap-3 p-4 text-xs break-all">
          {logData.length === 0 && (
            <p className="text-muted-foreground">
              {t("SETTINGS.LOG_AREA.NO_LOGS")}
            </p>
          )}

          {logData.map((logLine: any, i: number) => {
            return <p key={i}>{logLine}</p>;
          })}
          <p ref={bottomRef} />
        </code>
      </ScrollArea>
    </div>
  );
}
