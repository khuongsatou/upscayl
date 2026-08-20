import { ipcRenderer, contextBridge, webUtils } from "electron";
import {
  getAppVersion,
  getDeviceSpecs,
  getPlatform,
} from "./utils/get-device-specs";

// 'ipcRenderer' will be available in index.js with the method 'window.electron'
contextBridge.exposeInMainWorld("electron", {
  send: (command: string, payload: any) => ipcRenderer.send(command, payload),
  on: (command: string, func: (...args: any) => any) =>
    ipcRenderer.on(command, func),
  off: (command: string, func: (...args: any) => any) =>
    ipcRenderer.removeListener(command, func),
  invoke: (command: string, payload: any) =>
    ipcRenderer.invoke(command, payload),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  platform: getPlatform(),
  getSystemInfo: async () => await getDeviceSpecs(),
  getAppVersion: async () => await getAppVersion(),
});
