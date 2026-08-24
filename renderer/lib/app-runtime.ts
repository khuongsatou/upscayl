import { ELECTRON_COMMANDS } from "@common/electron-commands";
import {
  BatchUpscaylPayload,
  DoubleUpscaylPayload,
  ImageUpscaylPayload,
} from "@common/types/types";

type RuntimeListener = (event: unknown, data?: any) => void;
type RuntimePlatform = "mac" | "win" | "linux";
type UpscaylPayload =
  | ImageUpscaylPayload
  | DoubleUpscaylPayload
  | BatchUpscaylPayload;

type WebJobResponse = {
  id: string;
  progress: number;
  status:
    | "queued"
    | "processing"
    | "succeeded"
    | "failed"
    | "canceled"
    | "expired";
  estimatedRemainingSeconds: number | null;
  result: { url: string } | null;
  error: { code: string; message: string } | null;
};

const WEB_FOLDER_PREFIX = "web-folder://";
export const WEB_OUTPUT_PATH = "web-output://download";
const DEFAULT_WEB_API_V1_ENDPOINT = `${
  process.env.NEXT_PUBLIC_UPSCAYL_WEB_BASE_PATH ?? ""
}/api/v1`;

const getBrowserPlatform = (): RuntimePlatform => {
  if (typeof navigator === "undefined") return "linux";
  const platform = navigator.platform.toLowerCase();
  if (platform.includes("mac")) return "mac";
  if (platform.includes("win")) return "win";
  return "linux";
};

const createFileInput = ({
  accept,
  directory,
}: {
  accept?: string;
  directory?: boolean;
}) =>
  new Promise<FileList | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept ?? "";
    input.multiple = Boolean(directory);

    if (directory) {
      input.setAttribute("webkitdirectory", "");
      input.setAttribute("directory", "");
    }

    input.style.display = "none";
    input.onchange = () => {
      resolve(input.files);
      input.remove();
    };
    input.oncancel = () => {
      resolve(null);
      input.remove();
    };

    document.body.appendChild(input);
    input.click();
  });

class WebRuntime {
  platform = getBrowserPlatform();

  private listeners = new Map<string, Set<RuntimeListener>>();
  private files = new Map<string, File>();
  private folders = new Map<string, File[]>();
  private abortController: AbortController | null = null;
  private currentJobId: string | null = null;

  on(command: string, func?: RuntimeListener) {
    if (!func) return this;
    const commandListeners = this.listeners.get(command) ?? new Set();
    commandListeners.add(func);
    this.listeners.set(command, commandListeners);
    return this;
  }

  off(command: string, func?: RuntimeListener) {
    if (!func) return this;
    const commandListeners = this.listeners.get(command);
    commandListeners?.delete(func);
    return this;
  }

  send<T>(command: string, payload?: T) {
    if (
      command === ELECTRON_COMMANDS.UPSCAYL ||
      command === ELECTRON_COMMANDS.DOUBLE_UPSCAYL ||
      command === ELECTRON_COMMANDS.FOLDER_UPSCAYL
    ) {
      this.runWebUpscayl(command, payload as UpscaylPayload);
      return this;
    }

    if (command === ELECTRON_COMMANDS.STOP) {
      void this.cancelWebJob();
      this.abortController?.abort();
      this.emit(ELECTRON_COMMANDS.WEB_UPSCAYL_ETA, null);
      this.emit(
        ELECTRON_COMMANDS.UPSCAYL_ERROR,
        "The web upscale job stopped.",
      );
      return this;
    }

    if (
      command === ELECTRON_COMMANDS.OPEN_FOLDER &&
      typeof payload === "string"
    ) {
      window.open(payload, "_blank");
      return this;
    }

    if (command === ELECTRON_COMMANDS.PASTE_IMAGE) {
      this.handlePastedImage(payload as any);
      return this;
    }

    if (command === ELECTRON_COMMANDS.GET_MODELS_LIST) {
      this.emit(ELECTRON_COMMANDS.CUSTOM_MODEL_FILES_LIST, []);
      return this;
    }

    this.emit(
      ELECTRON_COMMANDS.LOG,
      `Web runtime ignored unsupported command: ${command}`,
    );
    return this;
  }

  async invoke(command: string) {
    if (command === ELECTRON_COMMANDS.SELECT_FILE) {
      const files = await createFileInput({
        accept: "image/png,image/jpeg,image/webp",
      });
      const file = files?.[0];
      return file ? this.registerFile(file) : null;
    }

    if (
      command === ELECTRON_COMMANDS.SELECT_FOLDER ||
      command === ELECTRON_COMMANDS.SELECT_CUSTOM_MODEL_FOLDER
    ) {
      const files = await createFileInput({ directory: true });
      if (!files?.length) return null;
      const folderId = `${WEB_FOLDER_PREFIX}${crypto.randomUUID()}`;
      this.folders.set(folderId, Array.from(files));
      return folderId;
    }

    return null;
  }

  registerFile(file: File) {
    const url = URL.createObjectURL(file);
    this.files.set(url, file);
    return url;
  }

  getFileName(path: string) {
    return this.files.get(path)?.name ?? path;
  }

  isWebFolder(path: string) {
    return path.startsWith(WEB_FOLDER_PREFIX);
  }

  async getSystemInfo() {
    return {
      platform: this.platform,
      release: navigator.userAgent,
      arch: undefined,
      model: "Browser",
      cpuCount: navigator.hardwareConcurrency ?? 0,
      gpu: {},
    };
  }

  async getAppVersion() {
    return "web";
  }

  private emit(command: string, data?: any) {
    this.listeners.get(command)?.forEach((listener) => listener({}, data));
  }

  private getProgressCommand(command: string) {
    if (command === ELECTRON_COMMANDS.DOUBLE_UPSCAYL) {
      return ELECTRON_COMMANDS.DOUBLE_UPSCAYL_PROGRESS;
    }
    if (command === ELECTRON_COMMANDS.FOLDER_UPSCAYL) {
      return ELECTRON_COMMANDS.FOLDER_UPSCAYL_PROGRESS;
    }
    return ELECTRON_COMMANDS.UPSCAYL_PROGRESS;
  }

  private getApiHeaders(includeJson = false) {
    const headers: Record<string, string> = {};
    const apiKey = process.env.NEXT_PUBLIC_UPSCAYL_API_KEY;
    if (apiKey) headers["X-API-Key"] = apiKey;
    if (includeJson) headers["Content-Type"] = "application/json";
    return headers;
  }

  private async readApiError(response: Response) {
    try {
      const data = await response.json();
      return data?.error?.message || `Upscale API returned ${response.status}.`;
    } catch {
      return `Upscale API returned ${response.status} ${response.statusText}.`;
    }
  }

  private async cancelWebJob() {
    if (!this.currentJobId) return;
    const endpoint =
      process.env.NEXT_PUBLIC_UPSCAYL_API_V1_URL ?? DEFAULT_WEB_API_V1_ENDPOINT;
    await fetch(`${endpoint}/jobs/${encodeURIComponent(this.currentJobId)}`, {
      method: "DELETE",
      headers: this.getApiHeaders(),
    }).catch(() => undefined);
  }

  private async uploadWebFile(
    endpoint: string,
    file: File,
    signal: AbortSignal,
  ) {
    const formData = new FormData();
    formData.append("file", file, file.name);
    const response = await fetch(`${endpoint}/uploads`, {
      method: "POST",
      headers: this.getApiHeaders(),
      body: formData,
      signal,
    });
    if (!response.ok) throw new Error(await this.readApiError(response));
    return (await response.json()) as { id: string };
  }

  private async pollWebJob(
    endpoint: string,
    jobId: string,
    progressCommand: string,
    signal: AbortSignal,
  ) {
    let lastProgress = -1;
    let lastEstimatedRemainingSeconds: number | null = null;

    while (!signal.aborted) {
      const response = await fetch(
        `${endpoint}/jobs/${encodeURIComponent(jobId)}`,
        {
          method: "GET",
          headers: this.getApiHeaders(),
          cache: "no-store",
          signal,
        },
      );
      if (!response.ok) throw new Error(await this.readApiError(response));
      const data = (await response.json()) as WebJobResponse;
      const progress = Math.min(100, Math.max(0, data.progress));
      if (progress !== lastProgress) {
        this.emit(progressCommand, `${progress.toFixed(2)}%`);
        lastProgress = progress;
      }
      const estimatedRemainingSeconds = Number.isFinite(
        data.estimatedRemainingSeconds,
      )
        ? Math.max(0, Math.ceil(data.estimatedRemainingSeconds as number))
        : null;
      if (estimatedRemainingSeconds !== lastEstimatedRemainingSeconds) {
        this.emit(ELECTRON_COMMANDS.WEB_UPSCAYL_ETA, estimatedRemainingSeconds);
        lastEstimatedRemainingSeconds = estimatedRemainingSeconds;
      }
      if (data.status === "succeeded") return data;
      if (["failed", "canceled", "expired"].includes(data.status)) {
        throw new Error(data.error?.message || `Upscale job ${data.status}.`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new DOMException("The operation was aborted.", "AbortError");
  }

  private async runWebUpscayl(command: string, payload: UpscaylPayload) {
    const endpoint =
      process.env.NEXT_PUBLIC_UPSCAYL_API_V1_URL ?? DEFAULT_WEB_API_V1_ENDPOINT;
    const progressCommand = this.getProgressCommand(command);
    const abortController = new AbortController();
    this.abortController = abortController;
    this.emit(progressCommand, "0.00%");
    this.emit(ELECTRON_COMMANDS.WEB_UPSCAYL_ETA, null);

    try {
      const files =
        "imagePath" in payload
          ? ([this.files.get(payload.imagePath)].filter(Boolean) as File[])
          : (this.folders.get(payload.batchFolderPath) ?? []);
      if (!files.length) {
        throw new Error(
          "The selected browser image is no longer available. Please select it again.",
        );
      }
      const uploads = [] as Array<{ id: string }>;
      for (const file of files) {
        uploads.push(
          await this.uploadWebFile(endpoint, file, abortController.signal),
        );
      }
      const mode =
        command === ELECTRON_COMMANDS.FOLDER_UPSCAYL
          ? "batch"
          : command === ELECTRON_COMMANDS.DOUBLE_UPSCAYL
            ? "double"
            : "single";
      const createResponse = await fetch(`${endpoint}/jobs`, {
        method: "POST",
        headers: {
          ...this.getApiHeaders(true),
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          mode,
          uploadIds: uploads.map((upload) => upload.id),
          model: payload.model,
          scale: Number(payload.scale),
          outputFormat:
            payload.saveImageAs === "jpeg" ? "jpg" : payload.saveImageAs,
          compression: Number(payload.compression ?? 0),
          customWidth: payload.useCustomWidth
            ? Number(payload.customWidth)
            : null,
          tileSize: Number(payload.tileSize ?? 0),
          tta: Boolean(payload.ttaMode),
        }),
        signal: abortController.signal,
      });
      if (!createResponse.ok)
        throw new Error(await this.readApiError(createResponse));
      const created = (await createResponse.json()) as WebJobResponse;
      this.currentJobId = created.id;
      const completed = await this.pollWebJob(
        endpoint,
        created.id,
        progressCommand,
        abortController.signal,
      );
      if (!completed.result?.url)
        throw new Error("Upscale API did not return a result URL.");
      const resultResponse = await fetch(completed.result.url, {
        headers: this.getApiHeaders(),
        signal: abortController.signal,
      });
      if (!resultResponse.ok)
        throw new Error(await this.readApiError(resultResponse));
      this.emit(progressCommand, "100.00%");
      const outputUrl = URL.createObjectURL(await resultResponse.blob());
      this.emit(
        command === ELECTRON_COMMANDS.FOLDER_UPSCAYL
          ? ELECTRON_COMMANDS.FOLDER_UPSCAYL_DONE
          : command === ELECTRON_COMMANDS.DOUBLE_UPSCAYL
            ? ELECTRON_COMMANDS.DOUBLE_UPSCAYL_DONE
            : ELECTRON_COMMANDS.UPSCAYL_DONE,
        outputUrl,
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      this.emit(
        ELECTRON_COMMANDS.UPSCAYL_ERROR,
        (error as Error).message ||
          "Web upscale failed through the /api/v1 job service.",
      );
    } finally {
      abortController.abort();
      this.emit(ELECTRON_COMMANDS.WEB_UPSCAYL_ETA, null);
      this.currentJobId = null;
      if (this.abortController === abortController) {
        this.abortController = null;
      }
    }
  }

  private handlePastedImage(filePayload: {
    encodedBuffer: string;
    extension: string;
    name: string;
  }) {
    try {
      const bytes = Uint8Array.from(atob(filePayload.encodedBuffer), (char) =>
        char.charCodeAt(0),
      );
      const file = new File([bytes], filePayload.name, {
        type: `image/${filePayload.extension}`,
      });
      this.emit(
        ELECTRON_COMMANDS.PASTE_IMAGE_SAVE_SUCCESS,
        this.registerFile(file),
      );
    } catch (error) {
      this.emit(
        ELECTRON_COMMANDS.PASTE_IMAGE_SAVE_ERROR,
        (error as Error).message,
      );
    }
  }
}

const webRuntime = new WebRuntime();

export const appRuntime =
  typeof window !== "undefined" && window.electron
    ? window.electron
    : webRuntime;

export const isElectronRuntime = () =>
  typeof window !== "undefined" && Boolean(window.electron);

export const registerBrowserFile = (file: File) =>
  webRuntime.registerFile(file);

export const getRuntimeFileName = (path: string) =>
  isElectronRuntime() ? path : webRuntime.getFileName(path);

export const isRuntimeWebFolder = (path: string) =>
  !isElectronRuntime() && webRuntime.isWebFolder(path);
