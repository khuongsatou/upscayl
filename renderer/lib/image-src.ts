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
