import { app, dialog } from "electron";
import fs from "fs";
import path from "path";
import os from "os";
import settings from "electron-settings";
import logit from "../utils/logit";
import { FEATURE_FLAGS } from "../../common/feature-flags";
import {
  savedBatchUpscaylFolderPath,
  setSavedBatchUpscaylFolderPath,
  savedImagePath,
  setSavedImagePath,
} from "../utils/config-variables";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".jfif", ".webp", ".avif"];

export type SelectedItemKind = "file" | "folder";

export interface SelectedItem {
  kind: SelectedItemKind;
  path: string;
}

export interface SelectFilesAndFoldersResult {
  mode: "single-image" | "files" | "folder" | "mixed";
  batchFolderPath: string;
  singleImagePath: string | null;
  imagePaths: string[];
}

const isImageFile = (filePath: string): boolean => {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
};

const listImagesInFolder = (folderPath: string): string[] => {
  try {
    return fs
      .readdirSync(folderPath)
      .filter((file) => isImageFile(file))
      .map((file) => path.join(folderPath, file));
  } catch (err) {
    logit("⚠️ Failed to read folder for images: " + folderPath, err);
    return [];
  }
};

const stageLooseFiles = (looseFiles: string[]): string => {
  if (looseFiles.length === 0) return "";

  const parents = Array.from(new Set(looseFiles.map((f) => path.dirname(f))));
  if (parents.length === 1) {
    return parents[0];
  }

  const stageDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "upscayl-multiselect-"),
  );
  for (const file of looseFiles) {
    try {
      const dest = path.join(stageDir, path.basename(file));
      fs.copyFileSync(file, dest);
    } catch (err) {
      logit("⚠️ Failed to stage file: " + file, err);
    }
  }
  return stageDir;
};

const openSingleKindDialog = async (
  kind: "file" | "folder",
): Promise<string[] | null> => {
  let closeAccess: () => void | undefined;
  const folderBookmarks = await settings.get("folder-bookmarks");
  if (FEATURE_FLAGS.APP_STORE_BUILD && folderBookmarks) {
    try {
      closeAccess = app.startAccessingSecurityScopedResource(
        folderBookmarks as string,
      );
    } catch (error) {
      logit("📁 Folder Bookmarks Error: ", error);
    }
  }

  try {
    if (kind === "file") {
      const { canceled, filePaths, bookmarks } = await dialog.showOpenDialog({
        properties: ["openFile", "multiSelections"],
        title: "Select Images",
        defaultPath: savedImagePath || undefined,
        securityScopedBookmarks: true,
        message: "Select one or more images to upscale",
        filters: [
          {
            name: "Images",
            extensions: ["png", "jpg", "jpeg", "jfif", "webp", "avif"],
          },
        ],
      });
      if (FEATURE_FLAGS.APP_STORE_BUILD && bookmarks && bookmarks.length > 0) {
        await settings.set("file-bookmarks", bookmarks[0]);
      }
      if (canceled || filePaths.length === 0) return null;
      return filePaths;
    }

    const { canceled, filePaths, bookmarks } = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Select Folder",
      defaultPath: savedBatchUpscaylFolderPath || undefined,
      securityScopedBookmarks: true,
      message: "Select a folder of images to upscale",
    });
    if (FEATURE_FLAGS.APP_STORE_BUILD && bookmarks && bookmarks.length > 0) {
      await settings.set("folder-bookmarks", bookmarks[0]);
    }
    if (canceled || filePaths.length === 0) return null;
    return filePaths;
  } finally {
    if (closeAccess) {
      try {
        closeAccess();
      } catch (err) {
        logit("⚠️ closeAccess error: ", err);
      }
    }
  }
};

const classify = (paths: string[]): { files: string[]; folders: string[] } => {
  const files: string[] = [];
  const folders: string[] = [];
  for (const p of paths) {
    try {
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        folders.push(p);
      } else if (stat.isFile()) {
        if (isImageFile(p)) files.push(p);
        else logit("⚠️ Skipping non-image file: " + p);
      }
    } catch (err) {
      logit("⚠️ Failed to stat selected path: " + p, err);
    }
  }
  return { files, folders };
};

const finalizeFromPaths = (
  files: string[],
  folders: string[],
): SelectFilesAndFoldersResult | null => {
  if (files.length === 0 && folders.length === 0) return null;

  if (files.length === 1 && folders.length === 0) {
    const singleImagePath = files[0];
    setSavedImagePath(singleImagePath);
    logit("🖼 Selected single image: ", singleImagePath);
    return {
      mode: "single-image",
      batchFolderPath: path.dirname(singleImagePath),
      singleImagePath,
      imagePaths: [singleImagePath],
    };
  }

  if (folders.length === 0) {
    const stageDir = stageLooseFiles(files);
    const images = listImagesInFolder(stageDir);
    setSavedBatchUpscaylFolderPath(stageDir);
    logit("📂 Selected loose files: ", files.length, " → ", stageDir);
    return {
      mode: "files",
      batchFolderPath: stageDir,
      singleImagePath: null,
      imagePaths: images,
    };
  }

  if (folders.length === 1 && files.length === 0) {
    const folder = folders[0];
    const images = listImagesInFolder(folder);
    setSavedBatchUpscaylFolderPath(folder);
    logit("📁 Selected folder: ", folder, " (", images.length, " images)");
    return {
      mode: "folder",
      batchFolderPath: folder,
      singleImagePath: null,
      imagePaths: images,
    };
  }

  // Mixed.
  const stageDir = stageLooseFiles(files);
  const folderImages = folders.flatMap(listImagesInFolder);
  const stagedImages = listImagesInFolder(stageDir);
  const allImages = [...folderImages, ...stagedImages];
  setSavedBatchUpscaylFolderPath(folders[0]);
  logit(
    "🗂 Mixed: ",
    folders.length,
    " folders + ",
    files.length,
    " loose files → ",
    allImages.length,
    " images",
  );
  return {
    mode: "mixed",
    batchFolderPath: folders[0],
    singleImagePath: null,
    imagePaths: allImages,
  };
};

const selectFilesAndFolders = async (
  _mode: "auto" | "images" | "folder" = "auto",
): Promise<SelectFilesAndFoldersResult | null> => {
  const picked = await openSingleKindDialog("file");
  let files: string[] = [];
  let folders: string[] = [];

  if (picked) {
    const c = classify(picked);
    files = c.files;
    folders = c.folders;
  }

  if (folders.length === 0 && files.length === 0) {
    return null;
  }

  if (folders.length === 0) {
    const { getMainWindow } = require("../main-window");
    const mainWindow = getMainWindow();
    if (mainWindow) {
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: "question",
        buttons: ["Add folder", "No, just upscale these"],
        defaultId: 1,
        cancelId: 1,
        title: "Add a folder?",
        message: "Do you also want to upscale images from a folder?",
      });
      if (choice === 0) {
        const folderPick = await openSingleKindDialog("folder");
        if (folderPick) {
          const c = classify(folderPick);
          folders = c.folders;
        }
      }
    }
  }
  return finalizeFromPaths(files, folders);
};

export default selectFilesAndFolders;
