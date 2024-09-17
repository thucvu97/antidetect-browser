// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import CloakAPIManager from 'cloak-stealth';
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example' | 'browser-status-update';

// Dynamically get the method names from the CloakAPIManager prototype, excluding the constructor
const ipcMethods = Object.getOwnPropertyNames(CloakAPIManager.prototype).filter(
  (method) => method !== 'constructor',
);

// Create the electronHandler object
const electronHandler: Record<string, any> = {};

// Dynamically map the methods to ipcRenderer.invoke
ipcMethods.forEach((method) => {
  electronHandler[method] = async (...args: any[]) => {
    try {
      // Ensure arguments are serializable
      const serializedArgs = JSON.parse(JSON.stringify(args));
      // Invoke the IPC method
      const result = await ipcRenderer.invoke(method, ...serializedArgs);
      // Ensure the result is serializable
      return JSON.parse(JSON.stringify(result));
    } catch (error) {
      console.error(`Error invoking ${method}:`, error);
      throw error;
    }
  };
});

// Additional ipcRenderer utilities, including onBrowserStatusUpdate
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
  onBrowserStatusUpdate(
    callback: (data: {
      status: string;
      details: any;
      profileId: string;
    }) => void,
  ) {
    const subscription = (
      _event: IpcRendererEvent,
      data: { status: string; details: any; profileId: string },
    ) => callback(data);
    ipcRenderer.on('browser-status-update', subscription);
    return () => {
      ipcRenderer.removeListener('browser-status-update', subscription);
    };
  },
};

// Expose the handler in the main world
contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
