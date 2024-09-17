/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import CloakAPIManager, { CloakAPIManagerConstructor } from 'cloak-stealth';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

let cloakManager: CloakAPIManagerConstructor;

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
const initializeCloakManager = () => {
  cloakManager = new CloakAPIManager({
    apiKey: 'lsk_3159f14d244956df9c1af13522bd6efad9960981f1c02402',
    windowOptions: { cols: 1, rows: 1 },
    turnstile: true,
    advancedStealthMode: true,
    browserStatusCallback: (status, profileId, details) => {
      // Immediately send the status update to all renderer processes
      BrowserWindow.getAllWindows().forEach((window) => {
        if (!window.isDestroyed()) {
          window.webContents.send('browser-status-update', {
            status,
            profileId,
            details,
          });
        }
      });
    },
  });
};
export const registerIPCHandlers = (
  cloakAPIManager: CloakAPIManagerConstructor | any,
) => {
  const methods = Object.getOwnPropertyNames(CloakAPIManager.prototype).filter(
    (method) => method !== 'constructor',
  ); // Exclude constructor

  methods.forEach((method) => {
    ipcMain.handle(method, async (event, ...args) => {
      try {
        // Ensure arguments are JSON serializable
        const serializedArgs = JSON.parse(JSON.stringify(args));

        // Execute the method and return serializable results
        const result = await cloakAPIManager[method](...serializedArgs);

        // Make sure the result is serializable
        return JSON.parse(JSON.stringify(result));
      } catch (error) {
        console.error(`Error in ${method}:`, error);
        throw error;
      }
    });
  });
};

app
  .whenReady()
  .then(() => {
    createWindow();
    if (!cloakManager) {
      initializeCloakManager();
      registerIPCHandlers(cloakManager);
    }
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

// ipcMain.handle('create-profile', async (event, profileOptions) => {
//   try {
//     return await cloakManager.create(profileOptions);
//   } catch (error) {
//     console.error('Error in create-profile:', error);
//     throw error;
//   }
// });

// ipcMain.handle('get-all-profile', async () => {
//   try {
//     return await cloakManager.getAllProfiles();
//   } catch (error) {
//     console.error('Error in get-profile-data:', error);
//     throw error;
//   }
// });
// ipcMain.handle('start', async (event, newProfileId) => {
//   try {
//     return await cloakManager.start({
//       profileId: newProfileId,
//     });
//   } catch (error) {
//     console.error('Error in get-profile-data:', error);
//     throw error;
//   }
// });
