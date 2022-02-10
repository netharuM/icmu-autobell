const { app, BrowserWindow, ipcMain, Tray, Menu } = require("electron");
const autoLaunch = require("auto-launch");
const path = require("path");
const { settingsConfig } = require("./configs");
const fs = require("fs");

const appDataPath = path.join(app.getPath("userData"), "data");
console.log("appDataPath: ", appDataPath);

if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath);
}

const settingsFile = new settingsConfig(
    path.join(appDataPath, "settings.json")
);

ipcMain.on("getAppDataPath", (event) => {
    event.returnValue = appDataPath;
});

ipcMain.on("version", (event, arg) => {
    event.reply("setVersion", app.getVersion());
});

// run in background when closed
ipcMain.on("set_rbw_closed", (e, arg) => {
    settingsFile.setBackgroundWhenClosed(arg);
});

ipcMain.on("get_rbw_closed", (e, arg) => {
    e.reply("set_rbw_closed", settingsFile.getBackgroundWhenClosed());
});

ipcMain.on("start-on-startup", (event, arg) => {
    if (arg) {
        settingsFile.setAutoLaunchInStartup(true);
        autolaunch.enable();
    } else {
        settingsFile.setAutoLaunchInStartup(false);
        autolaunch.disable();
    }
});
ipcMain.on("getAutoStartEnabled", (event, arg) => {
    autolaunch.isEnabled().then((enabled) => {
        event.reply("setAutoStartEnabled", enabled);
    });
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
    // eslint-disable-line global-require
    app.quit();
}

if (process.platform === "win32") {
    app.setAppUserModelId(app.name);
}

let tray = null;

const gotTheLock = app.requestSingleInstanceLock();
let autolaunch = new autoLaunch({
    name: "auto-bell",
    path: app.getPath("exe"),
});
if (settingsFile.getAutoLaunchInStartup()) {
    autolaunch.enable();
} else {
    autolaunch.disable();
}
const createWindow = () => {
    if (!gotTheLock) {
        app.quit();
    } else {
        app.on("second-instance", (event, command, workingDir) => {
            if (mainWindow) {
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                mainWindow.show();
            }
        });
    }
    ipcMain.on("focusWindow", (event, arg) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.show();
        }
    });
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1080,
        height: 720,
        minWidth: 480,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        show: false,
        autoHideMenuBar: true,
        icon: path.join(__dirname, "../assets/icon.png"),
    });

    mainWindow.on("close", (e) => {
        if (!app.isQuitting && settingsFile.getBackgroundWhenClosed()) {
            e.preventDefault();
            mainWindow.hide();
        }
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, "index.html"));

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    tray = new Tray(path.join(__dirname, "../assets/icon.png"));
    let contextMenuTemplate = [
        {
            label: "Quit",
            click: function () {
                app.quit();
            },
        },
        {
            label: "Open",
            click: function () {
                mainWindow.show();
            },
        },
    ];
    const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
    tray.setContextMenu(contextMenu);
    tray.setToolTip("auto-bell is running");
    tray.on("click", () => {
        mainWindow.show();
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on("before-quit", () => {
    app.isQuitting = true;
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
