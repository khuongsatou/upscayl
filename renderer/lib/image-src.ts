import { sanitizePath } from "@common/sanitize-path";

const isBrowserImageSrc = (path: string) =>
  path.startsWith("blob:") ||
  path.startsWith("data:") ||
  path.startsWith("http://") ||
  path.startsWith("https://");

export const toViewerPath = (path: string) =>
  isBrowserImageSrc(path) ? path : sanitizePath(path);

export const toImageSrc = (path: string) => {
  if (isBrowserImageSrc(path)) {
    return path;
  }

  return "file:///" + sanitizePath(path);
};

export const toPublicAssetSrc = (path: string) => {
  const normalizedPath = `/${path.replace(/^\/+/, "")}`;
  if (typeof window !== "undefined" && window.electron) {
    return `public://${normalizedPath}`;
  }

  const basePath = process.env.NEXT_PUBLIC_UPSCAYL_WEB_BASE_PATH ?? "";
  return `${basePath}${normalizedPath}`;
};
