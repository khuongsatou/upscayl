import React, { useCallback, useState } from "react";
import { translationAtom } from "@/atoms/translations-atom";
import { copyMetadataAtom } from "@/atoms/user-settings-atom";
import { useAtom, useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type CopyMetadataToggleProps = {
  saveImageAs: string;
  setExportType: (type: string) => void;
};

const CopyMetadataToggle = ({
  saveImageAs,
  setExportType,
}: CopyMetadataToggleProps) => {
  const [copyMetadata, setCopyMetadata] = useAtom(copyMetadataAtom);
  const t = useAtomValue(translationAtom);
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  const handleToggle = useCallback(() => {
    if (
      !copyMetadata &&
      !["jpg", "jpeg"].includes(saveImageAs.toLowerCase()) &&
      setExportType
    ) {
      setShowSuggestModal(true);
    } else {
      setCopyMetadata(!copyMetadata);
      localStorage.setItem("copyMetadata", (!copyMetadata).toString());
    }
  }, [copyMetadata, saveImageAs, setExportType, setCopyMetadata]);

  const handleChangeToJpg = useCallback(() => {
    setShowSuggestModal(false);
    setCopyMetadata(true);
    localStorage.setItem("copyMetadata", true.toString());
    setExportType("jpg");
  }, [setCopyMetadata, setExportType]);

  const handleKeepFormat = useCallback(() => {
    setShowSuggestModal(false);
    setCopyMetadata(true);
    localStorage.setItem("copyMetadata", true.toString());
  }, [setCopyMetadata]);

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex items-start justify-between">
        <Field orientation="horizontal" className="w-full">
          <FieldContent>
            <FieldLabel id="copy-metadata-title">
              {t("COPY IMAGE METADATA")}
            </FieldLabel>
            <FieldDescription id="copy-metadata-description">
              {t("Keep original image metadata (EXIF) in the upscaled image.")}
              {copyMetadata &&
                !["jpg", "jpeg"].includes(saveImageAs.toLowerCase()) && (
                  <p className="text-warning text-xs">
                    {t("On some systems, metadata may not be visible in formats other than JPG. Use specific tools to view metadata if needed.")}
                  </p>
                )}
            </FieldDescription>
          </FieldContent>
          <Switch
            id="copy-metadata-toggle"
            aria-labelledby="copy-metadata-title"
            aria-describedby="copy-metadata-description"
            checked={copyMetadata}
            onCheckedChange={handleToggle}
          />
        </Field>
      </div>

      <Dialog open={showSuggestModal} onOpenChange={setShowSuggestModal}>
        <DialogContent className="sm:max-w-96">
          <DialogHeader>
            <DialogTitle>
              {t("Recommended Format Change")}
            </DialogTitle>
            <DialogDescription>
              {t("For better metadata compatibility across different systems, we recommend using JPG format. Would you like to change?")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleKeepFormat}>
              {t("Keep {format}").replace(
                "{format}",
                saveImageAs.toUpperCase(),
              )}
            </Button>
            <Button onClick={handleChangeToJpg}>
              {t("Change to JPG")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CopyMetadataToggle;
