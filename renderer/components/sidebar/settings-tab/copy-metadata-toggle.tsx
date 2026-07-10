import React, { useState, useCallback } from "react";
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
              {t("SETTINGS.COPY_METADATA.TITLE")}
            </FieldLabel>
            <FieldDescription id="copy-metadata-description">
              {t("SETTINGS.COPY_METADATA.DESCRIPTION")}
              {copyMetadata &&
                !["jpg", "jpeg"].includes(saveImageAs.toLowerCase()) && (
                  <p className="text-warning text-xs">
                    {t("WARNING.METADATA_FORMAT.DESCRIPTION")}
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

      {showSuggestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowSuggestModal(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowSuggestModal(false)}
          tabIndex={0}
        >
          <div
            className="bg-base-100 w-96 rounded-lg p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {t("SETTINGS.COPY_METADATA.SUGGEST_JPG_TITLE")}
              </h3>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setShowSuggestModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="text-base-content/80 mb-4 text-sm">
              {t("SETTINGS.COPY_METADATA.SUGGEST_JPG_DESCRIPTION")}
            </p>
            <div className="flex justify-end gap-2">
              <button className="btn btn-primary" onClick={handleChangeToJpg}>
                {t("SETTINGS.COPY_METADATA.CHANGE_TO_JPG")}
              </button>
              <button className="btn" onClick={handleKeepFormat}>
                {t("SETTINGS.COPY_METADATA.KEEP_CURRENT_FORMAT").replace(
                  "{format}",
                  saveImageAs.toUpperCase(),
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CopyMetadataToggle;

