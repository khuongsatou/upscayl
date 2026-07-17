import type { ModelId } from "@common/models-list";

export type ModelFilter = "all" | "built-in" | "custom";

export type ModelOption = {
  id: string;
  name: string;
  description: string;
  kind: Exclude<ModelFilter, "all">;
  afterPreviewSrc?: string;
};

export type PreviewPaths = {
  before: string;
  after: string;
};

export type ModelSelectionPanelProps = {
  searchQuery: string;
  modelFilter: ModelFilter;
  customModelCount: number;
  selectedModelId: string;
  visibleModels: ModelOption[];
  onSearchQueryChange: (value: string) => void;
  onModelFilterChange: (filter: ModelFilter) => void;
  onModelSelect: (modelId: string) => void;
};

export type ModelDetailsPanelProps = {
  modelId: ModelId | null;
  modelName: string;
  modelDescription: string;
  previewPaths: PreviewPaths | null;
  hasPreview: boolean;
  isBeforePreviewUnavailable: boolean;
  isAfterPreviewUnavailable: boolean;
  onPreviewUnavailable: (path: string) => void;
  onZoom: (modelId: ModelId) => void;
};

export type ModelPreviewDialogProps = {
  modelId: ModelId | null;
  previewPaths: PreviewPaths | null;
  isBeforePreviewUnavailable: boolean;
  isAfterPreviewUnavailable: boolean;
  onPreviewUnavailable: (path: string) => void;
  onClose: () => void;
};

export type ModelImageComparisonProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel: string;
  afterLabel: string;
  isBeforeUnavailable: boolean;
  isAfterUnavailable: boolean;
  className?: string;
  onPreviewUnavailable: (path: string) => void;
};
