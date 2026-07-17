import { XIcon } from "lucide-react";
import useTranslation from "@/components/hooks/use-translation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ModelPreviewDialogProps } from "@/types/model-selection";
import ModelImageComparison from "./model-image-comparison";

const ModelPreviewDialog = ({
  modelId,
  previewPaths,
  isBeforePreviewUnavailable,
  isAfterPreviewUnavailable,
  onPreviewUnavailable,
  onClose,
}: ModelPreviewDialogProps) => {
  const t = useTranslation();

  if (!modelId || !previewPaths) return null;

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-full overflow-hidden border-border/80 bg-popover p-0 sm:max-h-[90vh] sm:max-w-[90vw]"
      >
        <DialogHeader className="border-b bg-muted/30 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {t(`APP.MODEL_SELECTION.MODELS.${modelId}.NAME`)}
              </DialogTitle>
              <DialogDescription>
                Compare the bundled before and after preview
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground"
              >
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="bg-black p-0">
          <ModelImageComparison
            beforeSrc={previewPaths.before}
            afterSrc={previewPaths.after}
            beforeAlt="Zoomed in Image - Before"
            afterAlt="Zoomed in Image - After"
            beforeLabel={t("APP.MODEL_SELECTION.BEFORE")}
            afterLabel={t("APP.MODEL_SELECTION.AFTER")}
            isBeforeUnavailable={isBeforePreviewUnavailable}
            isAfterUnavailable={isAfterPreviewUnavailable}
            className="aspect-video max-h-[calc(90vh-6rem)] min-h-[20rem] w-full"
            onPreviewUnavailable={onPreviewUnavailable}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModelPreviewDialog;
