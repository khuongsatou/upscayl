import type { NextApiRequest, NextApiResponse } from "next";
import { createReadStream, promises as fs } from "fs";
import { constants } from "fs";
import { tmpdir } from "os";
import { basename, extname, join, parse, resolve } from "path";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { ZipArchive } from "archiver";
import formidable, { File as FormidableFile } from "formidable";
import getModelScale from "@common/check-model-scale";
import { ELECTRON_COMMANDS } from "@common/electron-commands";
import { imageFormats } from "@common/image-formats";
import { MODELS } from "@common/models-list";
import {
  BatchUpscaylPayload,
  DoubleUpscaylPayload,
  ImageUpscaylPayload,
} from "@common/types/types";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

type UpscaylPayload =
  | ImageUpscaylPayload
  | DoubleUpscaylPayload
  | BatchUpscaylPayload;

type ParsedForm = {
  fields: formidable.Fields<string>;
  files: formidable.Files<string>;
};

const MAX_FILE_SIZE = 1024 * 1024 * 200;
const MAX_TOTAL_FILE_SIZE = 1024 * 1024 * 600;
const MIN_SCALE = 1;
const MAX_SCALE = 16;
const MAX_CUSTOM_WIDTH = 8192;
const MAX_TILE_SIZE = 4096;
const MAX_BATCH_FILES = 100;
const VALID_INPUT_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

const getServerPlatform = () => {
  if (process.platform === "darwin") return "mac";
  if (process.platform === "win32") return "win";
  return "linux";
};

const getUpscaylBinaryPath = () => {
  const binaryName = process.platform === "win32" ? "upscayl-bin.exe" : "upscayl-bin";
  return resolve(process.cwd(), "resources", getServerPlatform(), "bin", binaryName);
};

const getModelsPath = () => resolve(process.cwd(), "resources", "models");

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const firstFile = (file: FormidableFile | FormidableFile[] | undefined) =>
  Array.isArray(file) ? file[0] : file;

const fileList = (file: FormidableFile | FormidableFile[] | undefined) => {
  if (!file) return [];
  return Array.isArray(file) ? file : [file];
};

const sanitizeName = (name: string) =>
  basename(name)
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+/, "")
    .slice(0, 120) || "image";

const stripUploadId = (name: string) =>
  name.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, "");

const validateImageUpload = (file: FormidableFile) => {
  const originalName = file.originalFilename || file.newFilename || file.filepath;
  const extension = extname(originalName).toLowerCase();
  const mimetype = file.mimetype ?? "";

  if (!VALID_INPUT_EXTENSIONS.has(extension) || !mimetype.startsWith("image/")) {
    throw new Error("Only PNG, JPG, JPEG, and WEBP uploads are supported.");
  }
};

const validatePayload = (command: string, payload: UpscaylPayload) => {
  if (
    command !== ELECTRON_COMMANDS.UPSCAYL &&
    command !== ELECTRON_COMMANDS.DOUBLE_UPSCAYL &&
    command !== ELECTRON_COMMANDS.FOLDER_UPSCAYL
  ) {
    throw new Error("Unsupported web upscale command.");
  }

  if (!("model" in payload) || !(payload.model in MODELS)) {
    throw new Error("Unsupported model for web upscaling.");
  }

  if (!imageFormats.includes(payload.saveImageAs)) {
    throw new Error("Unsupported output image format.");
  }

  const scale = Number(payload.scale);
  if (!Number.isInteger(scale) || scale < MIN_SCALE || scale > MAX_SCALE) {
    throw new Error(`Scale must be between ${MIN_SCALE} and ${MAX_SCALE}.`);
  }

  const compression = Number(payload.compression ?? 0);
  if (!Number.isInteger(compression) || compression < 0 || compression > 100) {
    throw new Error("Compression must be an integer between 0 and 100.");
  }

  if (payload.useCustomWidth) {
    const customWidth = Number(payload.customWidth);
    if (
      !Number.isInteger(customWidth) ||
      customWidth < 1 ||
      customWidth > MAX_CUSTOM_WIDTH
    ) {
      throw new Error(`Custom width must be between 1 and ${MAX_CUSTOM_WIDTH}.`);
    }
  }

  if (payload.tileSize !== null && payload.tileSize !== undefined) {
    const tileSize = Number(payload.tileSize);
    if (!Number.isInteger(tileSize) || tileSize < 0 || tileSize > MAX_TILE_SIZE) {
      throw new Error(`Tile size must be between 0 and ${MAX_TILE_SIZE}.`);
    }
  }

  if (payload.gpuId && !/^[\d,\s-]+$/.test(String(payload.gpuId))) {
    throw new Error("GPU ID contains unsupported characters.");
  }
};

const parseForm = (req: NextApiRequest, uploadDir: string) =>
  new Promise<ParsedForm>((resolveForm, rejectForm) => {
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      multiples: true,
      maxFileSize: MAX_FILE_SIZE,
      maxTotalFileSize: MAX_TOTAL_FILE_SIZE,
      filename: (_name, ext, part) => {
        const originalName = part.originalFilename || `image${ext}`;
        return `${randomUUID()}-${sanitizeName(originalName)}`;
      },
    });

    form.parse(req, (error, fields, files) => {
      if (error) {
        rejectForm(error);
        return;
      }
      resolveForm({ fields, files });
    });
  });

const runUpscayl = (args: string[], signal?: AbortSignal) =>
  new Promise<void>((resolveRun, rejectRun) => {
    const binaryPath = getUpscaylBinaryPath();
    const child = spawn(binaryPath, args.filter(Boolean), {
      cwd: process.cwd(),
      detached: false,
    });
    let output = "";
    let settled = false;

    const cleanup = () => {
      signal?.removeEventListener("abort", abortHandler);
    };

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };

    const abortHandler = () => {
      child.kill();
      finish(() => rejectRun(new Error("The web upscale job stopped.")));
    };

    if (signal?.aborted) {
      abortHandler();
      return;
    }
    signal?.addEventListener("abort", abortHandler);

    child.stdout.on("data", (data) => {
      output += data.toString();
    });
    child.stderr.on("data", (data) => {
      output += data.toString();
    });
    child.on("error", (error) => finish(() => rejectRun(error)));
    child.on("close", (code) => {
      if (code === 0) {
        finish(resolveRun);
        return;
      }
      finish(() =>
        rejectRun(
          new Error(
            output.trim() ||
              `Upscayl web backend exited with code ${code ?? "unknown"}.`,
          ),
        ),
      );
    });
  });

const buildUpscaylArgs = ({
  inputPath,
  outputPath,
  payload,
}: {
  inputPath: string;
  outputPath: string;
  payload: ImageUpscaylPayload | DoubleUpscaylPayload | BatchUpscaylPayload;
}) => {
  const customWidth =
    payload.useCustomWidth && payload.customWidth
      ? String(payload.customWidth)
      : "";
  const includeScale = getModelScale(payload.model) !== payload.scale && !customWidth;
  const tileSize = payload.tileSize ? String(payload.tileSize) : "";
  const gpuId = payload.gpuId ? String(payload.gpuId) : "";

  return [
    "-i",
    inputPath,
    "-o",
    outputPath,
    includeScale ? "-s" : "",
    includeScale ? payload.scale : "",
    "-m",
    getModelsPath(),
    "-n",
    payload.model,
    gpuId ? "-g" : "",
    gpuId,
    "-f",
    payload.saveImageAs,
    customWidth ? "-w" : "",
    customWidth,
    "-c",
    String(payload.compression ?? "0"),
    tileSize ? "-t" : "",
    tileSize,
    payload.ttaMode ? "-x" : "",
  ];
};

const makeOutputFilePath = (
  inputFile: FormidableFile,
  outputDir: string,
  payload: ImageUpscaylPayload | DoubleUpscaylPayload,
) => {
  const originalName = sanitizeName(inputFile.originalFilename || basename(inputFile.filepath));
  const parsedName = parse(originalName).name || "image";
  const suffix = payload.useCustomWidth && payload.customWidth
    ? `${payload.customWidth}px`
    : `${payload.scale}x`;

  return join(
    outputDir,
    `${parsedName}_upscayl_${suffix}_${payload.model}.${payload.saveImageAs}`,
  );
};

const sendFileResponse = async (
  res: NextApiResponse,
  filePath: string,
  jobDir: string,
  saveImageAs: string,
) => {
  await fs.access(filePath, constants.R_OK);

  const contentType =
    saveImageAs === "jpg" || saveImageAs === "jpeg"
      ? "image/jpeg"
      : saveImageAs === "webp"
        ? "image/webp"
        : "image/png";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `inline; filename="${basename(filePath)}"`);
  res.on("finish", () => {
    fs.rm(jobDir, { recursive: true, force: true }).catch(() => undefined);
  });
  createReadStream(filePath).pipe(res);
};

const sendZipResponse = async (
  res: NextApiResponse,
  outputDir: string,
  jobDir: string,
) => {
  const entries = await fs.readdir(outputDir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile());
  if (files.length === 0) {
    throw new Error("Batch upscaling did not produce any output files.");
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="upscayl-web-output.zip"');
  res.on("finish", () => {
    fs.rm(jobDir, { recursive: true, force: true }).catch(() => undefined);
  });

  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.pipe(res);
  files.forEach((entry) => {
    archive.file(join(outputDir, entry.name), {
      name: stripUploadId(entry.name),
    });
  });
  await new Promise<void>((resolveArchive, rejectArchive) => {
    archive.on("end", resolveArchive);
    archive.on("error", rejectArchive);
    archive.finalize().catch(rejectArchive);
  });
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).send("Method not allowed.");
    return;
  }

  const jobDir = await fs.mkdtemp(join(tmpdir(), "upscayl-web-"));
  const uploadDir = join(jobDir, "uploads");
  const outputDir = join(jobDir, "output");
  const abortController = new AbortController();
  let finished = false;

  req.on("aborted", () => abortController.abort());
  res.on("finish", () => {
    finished = true;
  });
  res.on("close", () => {
    if (!finished) abortController.abort();
  });

  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    await fs.access(getUpscaylBinaryPath(), constants.X_OK);
    await fs.access(getModelsPath(), constants.R_OK);

    const { fields, files } = await parseForm(req, uploadDir);
    const command = firstValue(fields.command);
    const payloadText = firstValue(fields.payload);

    if (!command || !payloadText) {
      throw new Error("Missing web upscale command or payload.");
    }

    const payload = JSON.parse(payloadText) as UpscaylPayload;
    validatePayload(command, payload);

    if (
      command === ELECTRON_COMMANDS.UPSCAYL ||
      command === ELECTRON_COMMANDS.DOUBLE_UPSCAYL
    ) {
      const image = firstFile(files.image);
      if (!image) throw new Error("No image was uploaded.");
      validateImageUpload(image);

      const outputFile = makeOutputFilePath(
        image,
        outputDir,
        payload as ImageUpscaylPayload | DoubleUpscaylPayload,
      );
      await runUpscayl(
        buildUpscaylArgs({
          inputPath: image.filepath,
          outputPath: outputFile,
          payload: payload as ImageUpscaylPayload | DoubleUpscaylPayload,
        }),
        abortController.signal,
      );

      if (command === ELECTRON_COMMANDS.DOUBLE_UPSCAYL) {
        await runUpscayl(
          buildUpscaylArgs({
            inputPath: outputFile,
            outputPath: outputFile,
            payload: payload as DoubleUpscaylPayload,
          }),
          abortController.signal,
        );
      }

      await sendFileResponse(res, outputFile, jobDir, payload.saveImageAs);
      return;
    }

    const images = fileList(files.images);
    if (images.length === 0) throw new Error("No batch images were uploaded.");
    if (images.length > MAX_BATCH_FILES) {
      throw new Error(`Batch uploads are limited to ${MAX_BATCH_FILES} images.`);
    }
    images.forEach(validateImageUpload);

    await runUpscayl(
      buildUpscaylArgs({
        inputPath: uploadDir,
        outputPath: outputDir,
        payload: payload as BatchUpscaylPayload,
      }),
      abortController.signal,
    );
    await sendZipResponse(res, outputDir, jobDir);
  } catch (error) {
    await fs.rm(jobDir, { recursive: true, force: true }).catch(() => undefined);
    if (!res.headersSent) {
      res.status(500).send((error as Error).message || "Web upscaling failed.");
    }
  }
};

export default handler;
