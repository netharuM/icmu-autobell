const { shell, ipcRenderer } = require("electron");

class tabs {
    constructor(tabArray) {
        /**
         * @param {array} tabArray array of tab objects
         */
        this.tabBox = document.getElementById("settingsTabs");
        this.tabArray = tabArray;
        for (let i = 0; i < this.tabArray.length; i++) {
            this.tabArray[i].element.style.display = "none";
            let tab = this.createTabButton(
                this.tabArray[i].name,
                this.tabArray[i].element,
                this.tabArray[i].callback
            );
            let tabName = document.createElement("label");
            tabName.innerText = this.tabArray[i].name;
            tabName.classList.add("tab");
            tabName.htmlFor = tab.id;
            this.tabBox.appendChild(tab);
            this.tabBox.appendChild(tabName);
        }
        document.getElementsByClassName("tab_radio")[0].checked = true;
        // displaying the first tab and executing the callback
        this.tabArray[0].element.style.display = null;
        if (this.tabArray[0].callback) {
            this.tabArray[0].callback();
        }
    }

    createTabButton(name, element, callback) {
        /**
         * @param {string} name name of the tab
         * @param {HTMLElement} element element to be shown
         * @param {function} callback callback function
         */
        const tab = document.createElement("input");
        tab.type = "radio";
        tab.name = "tab";
        tab.classList.add("tab_radio");
        tab.innerText = name;
        tab.id = `tab-${name}`;
        tab.addEventListener("change", (e) => {
            for (let i = 0; i < this.tabArray.length; i++) {
                this.tabArray[i].element.style.display = "none";
            }
            element.style.display = null;
            if (callback) {
                callback();
            }
        });
        return tab;
    }
}

class audioSettings {
    constructor() {
        this.bellOutSelect = document.getElementById(
            "bellAudioOutPutSelection"
        );
        this.devices = [];
        this.onChange = () => {};
        this.onOtherOutChange = () => {};
        this.onBellOutChange = () => {};
        this.otherOutSelect = document.getElementById(
            "otherAudioOutPutSelection"
        );
        navigator.mediaDevices.addEventListener("devicechange", async () => {
            await this.render();
            this.onChange();
        });
        this.bellOutSelect.addEventListener("change", (e) => {
            this.onBellOutChange(e);
        });
        this.otherOutSelect.addEventListener("change", (e) => {
            this.onOtherOutChange(e);
        });
    }

    async render() {
        const devices = await this.getDevices();
        this.bellOutSelect.innerHTML = "";
        this.otherOutSelect.innerHTML = "";
        for (let i = 0; i < devices.length; i++) {
            const option = document.createElement("option");
            option.value = devices[i].deviceId;
            option.innerText = devices[i].label;
            this.bellOutSelect.appendChild(option);
            this.otherOutSelect.appendChild(option.cloneNode(true));
        }
    }

    getBellOut() {
        return this.bellOutSelect.value;
    }

    getAudioOut() {
        return this.otherOutSelect.value;
    }

    async getDevices() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outPutDevices = devices.filter(
            (device) =>
                device.kind === "audiooutput" &&
                device.deviceId !== "default" &&
                device.deviceId !== "communications"
        );
        this.devices = outPutDevices;
        return outPutDevices;
    }
}

class settings {
    constructor() {
        this.container = document.getElementById("settingsPageContainer");
        this.page = document.getElementById("settingsPage");

        this.container.addEventListener("click", (e) => {
            if (e.target === this.container) {
                this.closePage();
            }
        });

        this.onAudioDevChange = () => {};
        this.onAudioBellOutChange = () => {};
        this.onAudioOtherOutChange = () => {};

        this.scrollPositionWhenOpened = [0, 0];

        this.tabs = new tabs([
            {
                name: "audio",
                element: document.getElementById("audioSettings"),
            },
            {
                name: "themes",
                element: document.getElementById("themeSettings"),
            },
            {
                name: "about",
                element: document.getElementById("aboutSettings"),
            },
        ]);

        this.audioSettings = new audioSettings();

        document.getElementById("instaLink").addEventListener("click", () => {
            shell.openExternal("https://instagram.com/netharu_methmitha");
        });
        document.getElementById("githubLink").addEventListener("click", () => {
            shell.openExternal("https://github.com/netharuM/icmu-autobell");
        });

        ipcRenderer.send("version");
        ipcRenderer.on("setVersion", (e, arg) => {
            document.getElementById("version").innerText = arg;
        });

        this.audioSettings.onChange = () => {
            this.onAudioDevChange();
        };

        this.audioSettings.onBellOutChange = (e) => {
            this.onAudioBellOutChange(e);
        };
        this.audioSettings.onOtherOutChange = (e) => {
            this.onAudioOtherOutChange(e);
        };

        this.closePage();
    }

    closePage() {
        window.scrollTo(
            this.scrollPositionWhenOpened[0],
            this.scrollPositionWhenOpened[1]
        );
        document.body.style.overflow = null;
        this.container.style.display = "none";
    }

    openPage() {
        this.scrollPositionWhenOpened = [window.scrollX, window.scrollY];
        window.scrollTo(0, 0);
        document.body.style.overflow = "hidden";
        this.container.style.display = null;
    }
}

module.exports = {
    settings: settings,
};