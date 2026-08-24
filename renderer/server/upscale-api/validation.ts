import type { NextApiRequest } from "next";
import { MODELS } from "@common/models-list";
import { apiConfig } from "./config";
import { UpscaleApiError } from "./errors";
import type { JobOptions } from "./types";

export const readJsonBody = async (req: NextApiRequest) => {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 1024 * 1024) {
      throw new UpscaleApiError(
        413,
        "BODY_TOO_LARGE",
        "JSON body is too large.",
      );
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    throw new UpscaleApiError(
      400,
      "INVALID_JSON",
      "Request body must be valid JSON.",
    );
  }
};

export const validateJobOptions = (body: any): JobOptions => {
  const mode = body.mode;
  if (!(["single", "double", "batch"] as const).includes(mode)) {
    throw new UpscaleApiError(
      400,
      "INVALID_MODE",
      "mode must be single, double, or batch.",
    );
  }
  const uploadIds = Array.isArray(body.uploadIds)
    ? body.uploadIds.filter((value) => typeof value === "string")
    : [];
  const expectedSingle = mode === "single" || mode === "double";
  if (
    uploadIds.length < 1 ||
    (expectedSingle && uploadIds.length !== 1) ||
    uploadIds.length > apiConfig.maxBatchFiles
  ) {
    throw new UpscaleApiError(
      400,
      "INVALID_UPLOAD_COUNT",
      expectedSingle
        ? "single and double jobs require exactly one uploadId."
        : `batch jobs support 1-${apiConfig.maxBatchFiles} uploadIds.`,
    );
  }
  if (new Set(uploadIds).size !== uploadIds.length) {
    throw new UpscaleApiError(
      400,
      "DUPLICATE_UPLOAD",
      "uploadIds must be unique.",
    );
  }
  const model = String(body.model || "upscayl-standard-4x");
  if (!(model in MODELS)) {
    throw new UpscaleApiError(
      400,
      "INVALID_MODEL",
      "Unsupported upscale model.",
    );
  }
  const scale = Number(body.scale ?? 4);
  if (![2, 3, 4].includes(scale)) {
    throw new UpscaleApiError(
      400,
      "INVALID_SCALE",
      "scale must be 2, 3, or 4.",
    );
  }
  const outputFormat = String(body.outputFormat || "png");
  if (!(["png", "jpg", "webp"] as const).includes(outputFormat as any)) {
    throw new UpscaleApiError(
      400,
      "INVALID_FORMAT",
      "outputFormat must be png, jpg, or webp.",
    );
  }
  const compression = Number(body.compression ?? 0);
  if (!Number.isInteger(compression) || compression < 0 || compression > 100) {
    throw new UpscaleApiError(
      400,
      "INVALID_COMPRESSION",
      "compression must be 0-100.",
    );
  }
  const customWidth =
    body.customWidth == null ? null : Number(body.customWidth);
  if (
    customWidth !== null &&
    (!Number.isInteger(customWidth) || customWidth < 1 || customWidth > 8192)
  ) {
    throw new UpscaleApiError(
      400,
      "INVALID_CUSTOM_WIDTH",
      "customWidth must be 1-8192.",
    );
  }
  const tileSize = Number(body.tileSize ?? 0);
  if (!Number.isInteger(tileSize) || tileSize < 0 || tileSize > 4096) {
    throw new UpscaleApiError(
      400,
      "INVALID_TILE_SIZE",
      "tileSize must be 0-4096.",
    );
  }
  return {
    mode,
    uploadIds,
    model,
    scale,
    outputFormat: outputFormat as JobOptions["outputFormat"],
    compression,
    customWidth,
    tileSize,
    tta: Boolean(body.tta),
  };
};
