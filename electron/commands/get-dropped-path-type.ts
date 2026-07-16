import { stat } from "node:fs/promises";

const getDroppedPathType = async (
  _event: Electron.IpcMainInvokeEvent,
  path: unknown,
) => {
  if (typeof path !== "string") return null;

  try {
    const pathStats = await stat(path);

    if (pathStats.isDirectory()) return "directory";
    if (pathStats.isFile()) return "file";
  } catch {
    return null;
  }

  return null;
};

export default getDroppedPathType;
