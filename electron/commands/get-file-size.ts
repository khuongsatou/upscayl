import { stat } from "node:fs/promises";

const getFileSize = async (
  _event: Electron.IpcMainInvokeEvent,
  filePath: unknown,
) => {
  if (typeof filePath !== "string") return null;

  try {
    const fileStats = await stat(filePath);
    return fileStats.isFile() ? fileStats.size : null;
  } catch {
    return null;
  }
};

export default getFileSize;
