const { bells } = require("./bell");
const { settings } = require("./settings");
const { bellsConfig } = require("./configs");
const { ipcRenderer } = require("electron");
const path = require("path");

const appDataPath = ipcRenderer.sendSync("getAppDataPath");
const bellsTable = new bellsConfig(path.join(appDataPath, "bells.json"));
const bellHandler = new bells(bellsTable.getBells());
const bellRefreshBtn = document.getElementById("refreshBells");

class sorters {
    constructor() {
        this.onActivate = (sorter) => {};
        this.activated = null;
        this.sortersElmnts = {
            name: document.getElementById("name-sort"),
            close: document.getElementById("closest-sort"),
        };
        this.addToSorters();
    }

    addToSorters() {
        for (const sorter in this.sortersElmnts) {
            this.sortersElmnts[sorter].addEventListener("click", () => {
                if (this.activated !== sorter) {
                    this.activate(sorter);
                }
            });
        }
    }

    activate(nameOfTheSorter) {
        this.activated = nameOfTheSorter;
        this.deactivateAll();
        this.sortersElmnts[nameOfTheSorter].classList.add("active");
        this.onActivate(this.activated);
    }

    deactivateAll() {
        for (const sorter in this.sortersElmnts) {
            this.deactivate(sorter);
        }
    }

    deactivate(nameOfTheSorter) {
        this.sortersElmnts[nameOfTheSorter].classList.remove("active");
    }
}

bellHandler.onBellSave = (index, bell) => {
    let newSettings = bell.getJSON();
    bellsTable.setBell(index, newSettings);
    bell.deactivateSave();
};

bellHandler.onBellDelete = (bell) => {
    bellsTable.removeBell(bell.getJSON());
};

bellsTable.updateBells = () => {
    bellHandler.setBells(bellsTable.getBells());
};

bellHandler.onBellAdd = (data) => {
    bellsTable.addBell(data);
};

bellRefreshBtn.addEventListener("click", () => {
    bellHandler.setBells(bellsTable.readBells());
});

const settingsOpenBtn = document.getElementById("settingsOpenBtn");
const settingsHandler = new settings();
const sorter = new sorters();
sorter.onActivate = (sorter) => {
    switch (sorter) {
        case "name":
            bellHandler.sortByName();
            bellsTable.setSortBy("name");
            break;
        case "close":
            bellHandler.sortByClosest();
            bellsTable.setSortBy("close");
            break;
    }
};

sorter.activate(bellsTable.getSortBy());

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
