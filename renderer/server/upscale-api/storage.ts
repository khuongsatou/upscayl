import type { NextApiRequest } from "next";
import { createReadStream, promises as fs } from "fs";
import { basename, extname, join } from "path";
import { randomUUID } from "crypto";
import formidable, { File as FormidableFile } from "formidable";
import { apiConfig } from "./config";
import { UpscaleApiError } from "./errors";
import type { ApiPrincipal, UploadRow } from "./types";
import { getDatabase } from "./database";

const supportedSignatures = [
  {
    mime: "image/png",
    extension: ".png",
    matches: (buffer: Buffer) =>
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
  {
    mime: "image/jpeg",
    extension: ".jpg",
    matches: (buffer: Buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  {
    mime: "image/webp",
    extension: ".webp",
    matches: (buffer: Buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

const sanitizeName = (value: string) =>
  basename(value)
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+/, "")
    .slice(0, 120) || "image";

const parseMultipart = (
  req: NextApiRequest,
  directory: string,
  options: { multiples: boolean; maxFiles: number; maxTotalFileSize: number },
) =>
  new Promise<{
    fields: formidable.Fields<string>;
    files: formidable.Files<string>;
  }>((resolve, reject) => {
    const form = formidable({
      uploadDir: directory,
      keepExtensions: false,
      multiples: options.multiples,
      maxFiles: options.maxFiles,
      maxFileSize: apiConfig.maxFileBytes,
      maxTotalFileSize: options.maxTotalFileSize,
      filename: () => randomUUID(),
    });
    form.parse(req, (error, fields, files) => {
      if (error) reject(error);
      else resolve({ fields, files });
    });
  });

const firstFile = (file: FormidableFile | FormidableFile[] | undefined) =>
  Array.isArray(file) ? file[0] : file;

const persistFile = async (
  file: FormidableFile,
  principal: ApiPrincipal,
  uploadDirectory: string,
): Promise<UploadRow> => {
  const handle = await fs.open(file.filepath, "r");
  const signatureBuffer = Buffer.alloc(16);
  const read = await handle.read(signatureBuffer, 0, signatureBuffer.length, 0);
  await handle.close();
  const signature = supportedSignatures.find((candidate) =>
    candidate.matches(signatureBuffer.subarray(0, read.bytesRead)),
  );
  if (!signature) {
    throw new UpscaleApiError(
      400,
      "INVALID_IMAGE",
      "File content is not a supported PNG, JPEG, or WEBP image.",
    );
  }
  const stat = await fs.stat(file.filepath);
  if (stat.size < 1 || stat.size > apiConfig.maxFileBytes) {
    throw new UpscaleApiError(
      413,
      "FILE_SIZE_EXCEEDED",
      `Image must be between 1 and ${apiConfig.maxFileBytes} bytes.`,
    );
  }
  const uploadId = randomUUID();
  const storagePath = join(
    uploadDirectory,
    `${uploadId}${signature.extension}`,
  );
  await fs.rename(file.filepath, storagePath);
  const now = Date.now();
  const row: UploadRow = {
    id: uploadId,
    owner_id: principal.id,
    original_name: sanitizeName(
      file.originalFilename || `image${signature.extension}`,
    ),
    mime_type: signature.mime,
    extension: signature.extension,
    size: stat.size,
    storage_path: storagePath,
    consumed: 0,
    created_at: now,
    expires_at: now + apiConfig.uploadTtlMs,
  };
  getDatabase()
    .prepare(
      `INSERT INTO uploads(id,owner_id,original_name,mime_type,extension,size,storage_path,consumed,created_at,expires_at)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      row.id,
      row.owner_id,
      row.original_name,
      row.mime_type,
      row.extension,
      row.size,
      row.storage_path,
      row.consumed,
      row.created_at,
      row.expires_at,
    );
  return row;
};

export const storeUpload = async (
  req: NextApiRequest,
  principal: ApiPrincipal,
): Promise<UploadRow> => {
  const uploadDirectory = join(apiConfig.dataDir, "uploads");
  await fs.mkdir(uploadDirectory, { recursive: true });
  let temporaryPath = "";
  try {
    const { files } = await parseMultipart(req, uploadDirectory, {
      multiples: false,
      maxFiles: 1,
      maxTotalFileSize: apiConfig.maxFileBytes,
    });
    const file = firstFile(files.file);
    if (!file) {
      throw new UpscaleApiError(
        400,
        "MISSING_FILE",
        "Multipart field 'file' is required.",
      );
    }
    temporaryPath = file.filepath;
    const row = await persistFile(file, principal, uploadDirectory);
    temporaryPath = "";
    return row;
  } catch (error) {
    if (temporaryPath)
      await fs.rm(temporaryPath, { force: true }).catch(() => undefined);
    if (error instanceof UpscaleApiError) throw error;
    const code = (error as any)?.code;
    if (code === 1009 || code === "ETOOBIG") {
      throw new UpscaleApiError(
        413,
        "FILE_SIZE_EXCEEDED",
        "Uploaded image is too large.",
      );
    }
    throw error;
  }
};

export const storeLegacyMultipart = async (
  req: NextApiRequest,
  principal: ApiPrincipal,
) => {
  const uploadDirectory = join(apiConfig.dataDir, "uploads");
  await fs.mkdir(uploadDirectory, { recursive: true });
  const parsed = await parseMultipart(req, uploadDirectory, {
    multiples: true,
    maxFiles: apiConfig.maxBatchFiles,
    maxTotalFileSize: apiConfig.maxBatchFiles * apiConfig.maxFileBytes,
  });
  const candidates = [
    ...(Array.isArray(parsed.files.image)
      ? parsed.files.image
      : parsed.files.image
        ? [parsed.files.image]
        : []),
    ...(Array.isArray(parsed.files.images)
      ? parsed.files.images
      : parsed.files.images
        ? [parsed.files.images]
        : []),
  ];
  const uploads: UploadRow[] = [];
  try {
    for (const file of candidates) {
      uploads.push(await persistFile(file, principal, uploadDirectory));
    }
    return { fields: parsed.fields, uploads };
  } catch (error) {
    await Promise.all(
      candidates.map((file) =>
        fs.rm(file.filepath, { force: true }).catch(() => undefined),
      ),
    );
    throw error;
  }
};

export const streamFile = (path: string) => createReadStream(path);

export const safeDownloadName = (value: string) =>
  sanitizeName(value).replace(/["\\]/g, "_");

export const extensionFromName = (value: string) =>
  extname(value).toLowerCase();
