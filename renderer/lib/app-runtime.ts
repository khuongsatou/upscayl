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

const WEB_FOLDER_PREFIX = "web-folder://";
export const WEB_OUTPUT_PATH = "web-output://download";
const DEFAULT_WEB_API_ENDPOINT = "/api/upscayl";

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
      this.abortController?.abort();
      this.emit(ELECTRON_COMMANDS.UPSCAYL_ERROR, "The web upscale job stopped.");
      return this;
    }

    if (command === ELECTRON_COMMANDS.OPEN_FOLDER && typeof payload === "string") {
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
      const files = await createFileInput({ accept: "image/png,image/jpeg,image/webp" });
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

  private async runWebUpscayl(command: string, payload: UpscaylPayload) {
    const endpoint =
      process.env.NEXT_PUBLIC_UPSCAYL_WEB_API_URL ?? DEFAULT_WEB_API_ENDPOINT;
    const formData = new FormData();

    formData.append("command", command);
    formData.append("payload", JSON.stringify(payload));

    if ("imagePath" in payload) {
      const file = this.files.get(payload.imagePath);
      if (!file) {
        this.emit(
          ELECTRON_COMMANDS.UPSCAYL_ERROR,
          "The selected browser image is no longer available. Please select it again.",
        );
        return;
      }
      formData.append("image", file, file.name);
    }

    if ("batchFolderPath" in payload) {
      const files = this.folders.get(payload.batchFolderPath) ?? [];
      files.forEach((file) => formData.append("images", file, file.name));
    }

    this.abortController = new AbortController();
    this.emit(ELECTRON_COMMANDS.UPSCAYL_PROGRESS, "0.00%");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const responseContentType = response.headers.get("content-type") ?? "";
        const errorText = responseContentType.includes("text/html")
          ? ""
          : await response.text();
        throw new Error(
          errorText ||
            `Web upscale backend returned ${response.status} ${response.statusText}`,
        );
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        const output = data.outputUrl ?? data.outputPath ?? data.url;
        if (!output) throw new Error("Web upscale backend did not return an output URL.");
        this.emit(
          command === ELECTRON_COMMANDS.FOLDER_UPSCAYL
            ? ELECTRON_COMMANDS.FOLDER_UPSCAYL_DONE
            : command === ELECTRON_COMMANDS.DOUBLE_UPSCAYL
              ? ELECTRON_COMMANDS.DOUBLE_UPSCAYL_DONE
              : ELECTRON_COMMANDS.UPSCAYL_DONE,
          output,
        );
        return;
      }

      const outputUrl = URL.createObjectURL(await response.blob());
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
          "Web upscale failed. Configure NEXT_PUBLIC_UPSCAYL_WEB_API_URL or provide /api/upscayl.",
      );
    } finally {
      this.abortController = null;
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
      this.emit(ELECTRON_COMMANDS.PASTE_IMAGE_SAVE_SUCCESS, this.registerFile(file));
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
  typeof window !== "undefined" && window.electron ? window.electron : webRuntime;

export const isElectronRuntime = () =>
  typeof window !== "undefined" && Boolean(window.electron);

export const registerBrowserFile = (file: File) => webRuntime.registerFile(file);

export const getRuntimeFileName = (path: string) =>
  isElectronRuntime() ? path : webRuntime.getFileName(path);

export const isRuntimeWebFolder = (path: string) =>
  !isElectronRuntime() && webRuntime.isWebFolder(path);
