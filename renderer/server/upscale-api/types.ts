export type ApiPrincipal = {
  id: string;
  kind: "api_key" | "banana_api_key" | "anonymous_web" | "internal";
  scopes: Set<string>;
  rateLimitPerHour: number;
  keyId?: string;
  keyPrefix?: string;
};

export type JobMode = "single" | "double" | "batch";
export type JobStatus =
  | "queued"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled"
  | "expired";

export type JobOptions = {
  mode: JobMode;
  uploadIds: string[];
  model: string;
  scale: number;
  outputFormat: "png" | "jpg" | "webp";
  compression: number;
  customWidth: number | null;
  tileSize: number;
  tta: boolean;
};

export type JobRow = {
  id: string;
  owner_id: string;
  idempotency_key: string | null;
  mode: JobMode;
  model: string;
  scale: number;
  output_format: "png" | "jpg" | "webp";
  compression: number;
  custom_width: number | null;
  tile_size: number;
  tta: number;
  status: JobStatus;
  progress: number;
  estimated_completion_at: number | null;
  input_count: number;
  output_path: string | null;
  output_mime: string | null;
  output_name: string | null;
  output_size: number | null;
  error_code: string | null;
  error_message: string | null;
  cancel_requested: number;
  created_at: number;
  started_at: number | null;
  updated_at: number;
  completed_at: number | null;
  expires_at: number;
  quota_reservation_id: string | null;
  usage_units: number;
};

export type UploadRow = {
  id: string;
  owner_id: string;
  original_name: string;
  mime_type: string;
  extension: string;
  size: number;
  storage_path: string;
  consumed: number;
  created_at: number;
  expires_at: number;
};

export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
  };
};
