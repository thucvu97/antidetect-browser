// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import CloakAPIManager from 'cloak-stealth';
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

// Dynamically get the method names from the CloakAPIManager prototype, excluding the constructor
const ipcMethods = Object.getOwnPropertyNames(CloakAPIManager.prototype).filter(
  (method) => method !== 'constructor',
);

// Create the electronHandler object
const electronHandler: Record<string, any> = {};

// Dynamically map the methods to ipcRenderer.invoke
ipcMethods.forEach((method) => {
  electronHandler[method] = (...args: any[]) =>
    ipcRenderer.invoke(method, ...args); // The method name is used as the IPC channel
});

// Additional ipcRenderer utilities, like sendMessage, on, once
electronHandler.ipcRenderer = {
  sendMessage(channel: Channels, ...args: unknown[]) {
    ipcRenderer.send(channel, ...args);
  },
  on(channel: Channels, func: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      func(...args);
    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  once(channel: Channels, func: (...args: unknown[]) => void) {
    ipcRenderer.once(channel, (_event, ...args) => func(...args));
  },
};

// Expose the handler in the main world
contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
