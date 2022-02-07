const { bells } = require("./bell");
const { settings } = require("./settings");
const path = require("path");
const { bellsConfig } = require("./configs");
const { ipcRenderer } = require("electron");

const appDataPath = ipcRenderer.sendSync("getAppDataPath");
const bellsTable = new bellsConfig(path.join(appDataPath, "bells.json"));
const bellHandler = new bells(bellsTable.getBells());
const bellRefreshBtn = document.getElementById("refreshBells");

bellHandler.onBellSave = (index, bell) => {
    let newSettings = bell.getJSON();
    bellsTable.setBell(index, newSettings);
    bell.deactivateSave();
};

bellHandler.onBellDelete = (bell) => {
    bellsTable.removeBell(bell);
};

bellHandler.onBellAdd = (data) => {
    bellsTable.addBell(data);
};

bellRefreshBtn.addEventListener("click", () => {
    bellHandler.setBells(bellsTable.readBells());
});

const settingsOpenBtn = document.getElementById("settingsOpenBtn");
const settingsHandler = new settings();

settingsOpenBtn.addEventListener("click", () => {
    settingsHandler.openPage();
});

settingsHandler.onAudioOtherOutChange = (e) => {
    console.log(e.target.value);
};
settingsHandler.onAudioBellOutChange = (e) => {
    console.log("bellChange");
    bellHandler.setBellAudioOutput(e.target.value);
};

let running = new Notification("auto-bell", {
    body: "auto-bell is running",
    icon: path.resolve(__dirname, "../assets/icon.png"),
});

running.onclick = () => {
    ipcRenderer.send("focusWindow");
};
