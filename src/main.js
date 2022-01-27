const { bells } = require("./bell");
const { settings } = require("./settings");
const fs = require("fs");
const path = require("path");

var bellTablePath = "../data/bells.json";

function loadTable(path) {
    // reading the bells
    const table = JSON.parse(fs.readFileSync(path, "utf8"));
    return {
        bells: table.bells,
    };
}

var bellTable = loadTable(path.resolve(__dirname, bellTablePath));
console.log(bellTable.bells);
bellTable.bells.map((bell) => {
    bell.audioPath = path.resolve(bell.audioPath);
    return bell;
});
const bellHandler = new bells(bellTable.bells);
const bellRefreshBtn = document.getElementById("refreshBells");

bellHandler.onBellSave = (index, bell) => {
    let newSettings = bell.getJSON();
    bellTable.bells[index] = newSettings;
    fs.writeFileSync(
        path.resolve(__dirname, bellTablePath),
        JSON.stringify(bellTable, null, 4)
    );
    bell.deactivateSave();
};

bellRefreshBtn.addEventListener("click", () => {
    bellTable = loadTable(path.resolve(__dirname, bellTablePath));
    bellHandler.setBells(bellTable.bells);
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

new Notification("auto-bell", {
    body: "auto-bell is running",
});
