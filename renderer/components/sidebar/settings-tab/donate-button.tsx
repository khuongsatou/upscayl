import { translationAtom } from "@/atoms/translations-atom";
import { Button } from "@/components/ui/button";
import { useAtomValue } from "jotai";
import React from "react";

export function DonateButton() {
  const t = useAtomValue(translationAtom);

  return (
    <div className="inline-flex justify-between gap-2 text-sm font-medium">
      <p>{t("If you like what we do :)")}</p>
      <Button variant="outline" size="sm" className="min-w-28" asChild>
        <a href="https://buymeacoffee.com/fossisthefuture" target="_blank">
          {t("💎 DONATE")}
        </a>
      </Button>
    </div>
  );
}
