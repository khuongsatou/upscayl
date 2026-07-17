import { MODELS } from "@common/models-list";
import type { ModelId } from "@common/models-list";
import type { PreviewPaths } from "@/types/model-selection";

export const isBuiltInModelId = (modelId: string): modelId is ModelId =>
  Object.prototype.hasOwnProperty.call(MODELS, modelId);

export const getModelPreviewPaths = (modelId: ModelId): PreviewPaths => {
  const basePath = `public:///model-comparison/${MODELS[modelId].id}`;

  return {
    before: `${basePath}/before.webp`,
    after: `${basePath}/after.webp`,
  };
};
