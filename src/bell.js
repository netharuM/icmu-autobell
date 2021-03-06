const { shell, ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");

function deepEqual(x, y) {
    const ok = Object.keys,
        tx = typeof x,
        ty = typeof y;
    return x && y && tx === "object" && tx === ty
        ? ok(x).length === ok(y).length &&
              ok(x).every((key) => deepEqual(x[key], y[key]))
        : x === y;
}
class bellAdder {
    constructor() {
        this.container = document.getElementById("newBellPanelContainer");
        this.bellPanel = document.getElementById("addNewBellPanel");
        this.cancelBtn = document.getElementById("cancelAddedBell");
        this.saveBtn = document.getElementById("saveAddedBell");
        this.bellName = document.getElementById("nameAddBell");
        this.bellDesciption = document.getElementById("descAddBell");
        this.selectAudio = document.getElementById("addAudioBtn");
        this.selectAudioFile = document.getElementById("audioAddBellFile");
        this.openInFolder = document.getElementById("openInFolderAddedAudio");
        this.timeControll = document.getElementById("addBellTime");
        this.scrollPositionWhenOpened = [0, 0];
        this.audioPath = "";
        this.onSave = () => {};
        this.container.addEventListener("click", (e) => {
            if (e.target === this.container) {
                this.closePanel();
            }
        });
        this.cancelBtn.addEventListener("click", () => {
            this.closePanel();
        });
        this.saveBtn.addEventListener("click", () => {
            let isSuccess = this.onSave();
            if (isSuccess) {
                this.closePanel();
            } else {
                this.bellPanel.style.setProperty("--foreground", "orange");
                setTimeout(() => {
                    this.bellPanel.style.setProperty("--foreground", null);
                }, 1000);
            }
        });
        this.openInFolder.addEventListener("click", () => {
            this.resolveAudioPath();
            shell.showItemInFolder(this.audioPath);
        });
        this.selectAudio.addEventListener("click", () => {
            this.selectAudioFile.click();
        });
        this.selectAudioFile.addEventListener("change", () => {
            let filePath = this.selectAudioFile.files[0].path;
            this.audioPath = filePath ? filePath : this.audioPath;
            this.resolveAudioPath();
        });
        this.closePanel();
    }

    reset() {
        this.selectAudioFile.value = "";
        this.audioPath = "";
        this.onSave = () => {};
        this.bellDesciption.value = "";
        this.bellName.value = "";
        this.timeControll.value = "";
    }

    resolveAudioPath() {
        this.audioPath = this.audioPath ? path.resolve(this.audioPath) : "";
    }

    checkEveryThingFilled() {
        this.resolveAudioPath();
        if (!fs.existsSync(this.audioPath)) {
            return false;
        }
        if (!this.bellName.value) {
            return false;
        }
        if (!this.bellDesciption.value) {
            return false;
        }
        if (!this.timeControll.value) {
            return false;
        }
        return true;
    }

    addBell(bellCallback) {
        this.openPanel();
        this.onSave = () => {
            // if everything is filled correctly we will send the bellData via a callback
            if (this.checkEveryThingFilled()) {
                let data = {
                    name: this.bellName.value,
                    desc: this.bellDesciption.value,
                    time: {
                        hour: parseInt(this.timeControll.value.split(":")[0]),
                        minute: parseInt(this.timeControll.value.split(":")[1]),
                    },
                    audioPath: this.audioPath,
                };
                bellCallback(data);
                return true;
            } else {
                return false;
            }
        };
    }

    openPanel() {
        this.scrollPositionWhenOpened = [window.scrollX, window.scrollY];
        window.scrollTo(0, 0);
        document.querySelector("body").style.overflow = "hidden";
        this.container.style.display = null;
    }
    closePanel() {
        this.reset();
        window.scrollTo(
            this.scrollPositionWhenOpened[0],
            this.scrollPositionWhenOpened[1]
        );
        document.querySelector("body").style.overflow = null;
        this.container.style.display = "none";
    }
}

class playBackController {
    constructor() {
        this.p_Btn = document.getElementById("controlBell"); // play pause button
        this.stopBtn = document.getElementById("stopBell");
        this.p_icon = document.getElementById("play_pause_icon");
        this.seeker = document.getElementById("bellSeeker");
        this.name = document.getElementById("nameOfPlayBack");
        this.controllerContainer = document.getElementById(
            "playBackControllerContainer"
        );
        this.onPlay = () => {};
        this.onPause = () => {};
        this.onStop = () => {};
        this.onSeek = () => {};
        this.p_Btn.addEventListener("click", () => {
            if (this.p_icon.innerHTML === "play_arrow") {
                this.onPlay();
                this.setPauseIcon();
            } else {
                this.onPause();
                this.setPlayIcon();
            }
        });
        this.seeker.addEventListener("change", (e) => {
            this.onSeek(e);
        });
        this.stopBtn.addEventListener("click", () => {
            this.onStop();
        });

        this.closeController();
    }

    setPauseIcon() {
        this.p_icon.innerHTML = "pause";
    }

    setPlayIcon() {
        this.p_icon.innerHTML = "play_arrow";
    }

    openController() {
        this.controllerContainer.style.display = null;
    }

    closeController() {
        this.controllerContainer.style.display = "none";
    }

    playBell(bell) {
        this.name.innerText = bell.data.name;
        this.setPauseIcon();
        this.openController();
        this.onPlay = () => {
            bell.playAlarm();
        };
        this.onPause = () => {
            bell.pauseAlarm();
        };
        bell.alarm.addEventListener("ended", () => {
            this.setPlayIcon();
            this.closeController();
        });
        this.onStop = () => {
            bell.stopAlarm();
            this.setPlayIcon();
            this.closeController();
        };
        this.onSeek = (e) => {
            bell.alarm.pause();
            let seekTo = bell.alarm.duration * (e.target.value / 100);
            bell.alarm.currentTime = seekTo;
            bell.alarm.play();
        };
        bell.alarm.addEventListener("timeupdate", (e) => {
            let nt = bell.alarm.currentTime * (100 / bell.alarm.duration);
            this.seeker.value = nt;
        });
    }
}

class bellEditor {
    constructor() {
        this.editor = document.getElementById("bellEditor");
        this.container = document.getElementById("bellEditorContainer");
        this.cancelBtn = document.getElementById("cancelEditedBell");
        this.saveBtn = document.getElementById("saveEditedBell");
        this.bellName = document.getElementById("nameEditBell");
        this.bellDesciption = document.getElementById("descEditBell");
        this.selectAudio = document.getElementById("selectAudioBtn");
        this.selectAudioFile = document.getElementById("audioEditBellFile");
        this.openInFolder = document.getElementById("openInFolder");
        this.timeControll = document.getElementById("editBellTime");

        this.audioPath = "";

        this.openInFolder.addEventListener("click", () => {
            this.resolveAudioPath();
            shell.showItemInFolder(this.audioPath);
        });

        this.selectAudio.addEventListener("click", () => {
            this.selectAudioFile.click();
        });

        this.selectAudioFile.addEventListener("change", () => {
            let filePath = this.selectAudioFile.files[0].path;
            this.audioPath = filePath ? filePath : this.audioPath;
            this.resolveAudioPath();
        });

        this.onSave = () => {};

        this.onClose = () => {};

        this.cancelBtn.addEventListener("click", (e) => {
            this.closeEditor(e);
        });

        this.saveBtn.addEventListener("click", (e) => {
            this.onSave();
            this.closeEditor(e);
        });

        this.container.addEventListener("click", (e) => {
            if (e.target === this.container) {
                this.closeEditor(e);
            }
        });

        this.scrollPositionWhenOpened = [0, 0];
        this.closeEditor();
    }

    resolveAudioPath() {
        this.audioPath = path.resolve(this.audioPath);
    }

    setEditorTime(time) {
        this.timeControll.value = time;
    }

    openEditor() {
        this.scrollPositionWhenOpened = [window.scrollX, window.scrollY];
        window.scrollTo(0, 0);
        document.querySelector("body").style.overflow = "hidden";
        this.container.style.display = null;
    }

    closeEditor() {
        window.scrollTo(
            this.scrollPositionWhenOpened[0],
            this.scrollPositionWhenOpened[1]
        );
        document.querySelector("body").style.overflow = null;
        this.container.style.display = "none";
        this.onClose();
    }

    editBell(bell, change) {
        this.bellName.value = bell.data.name;
        this.bellDesciption.value = bell.data.desc;
        this.audioPath = bell.data.audioPath;
        this.setEditorTime(bell.formattedTime);
        this.onSave = () => {
            if (change) {
                this.resolveAudioPath();
                let hour = parseInt(this.timeControll.value.split(":")[0]);
                let minute = parseInt(this.timeControll.value.split(":")[1]);
                //calling the callback in the value change
                change({
                    time: {
                        hour: hour,
                        minute: minute,
                    },
                    name: this.bellName.value,
                    desc: this.bellDesciption.value,
                    audioPath: this.audioPath,
                });
            }
        };
        this.openEditor();
    }
}

class bell {
    constructor(hour, minute, data) {
        this.time = {
            hour: hour,
            minute: minute,
        };
        this.onCancel = () => {};
        this.onAlarm = () => {};
        this.onEdit = () => {};
        this.onSave = () => {};
        this.onDelete = () => {};
        this.saveActivated = false;
        this.timeFormatter = new Intl.DateTimeFormat("en-US", {
            hourCycle: "h23",
            hour: "numeric",
            minute: "numeric",
        });
        this.time12hrFormatter = new Intl.DateTimeFormat("en-US", {
            hourCycle: "h23",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        });
        this.formattedTime12hr = this.time12hrFormatter.format(
            new Date(0, 0, 0, this.time.hour, this.time.minute)
        );
        this.formattedTime = this.timeFormatter.format(
            new Date(0, 0, 0, this.time.hour, this.time.minute)
        );
        this.data = data;
        this.alarm = new Audio(this.data.audioPath);
        this.alarm.addEventListener("ended", () => {
            this.element.classList.remove("playing");
        });
        this.alaramTimeOut = setTimeout(() => {
            this.alarm.play();
            this.onAlarm();
            this.element.classList.add("playing");
        }, this.eta());
        this.bellNotificationTimeOut = setTimeout(() => {
            this.bellNotification = new Notification(
                `auto-bell : ${data.name}`,
                {
                    body: `up coming alarm at ${this.formattedTime12hr}`,
                    icon: path.resolve(__dirname, "../assets/icon.png"),
                }
            );
            this.bellNotification.addEventListener("click", () => {
                ipcRenderer.send("focusWindow");
            });
            clearTimeout(this.bellNotificationTimeOut);
        }, this.eta() - 60000);
        var { bell, dropDown } = this.createBellElement();
        this.element = bell;
        this.dropDown = dropDown;
        this.hideDropDown();
    }

    stopAlarm() {
        this.alarm.pause();
        this.alarm.currentTime = 0;
        this.element.classList.remove("playing");
    }

    pauseAlarm() {
        this.alarm.pause();
    }

    playAlarm() {
        this.alarm.play();
    }

    getJSON() {
        return {
            ...this.data,
            time: this.time,
        };
    }

    setSinkId(sinkId) {
        this.alarm.setSinkId(sinkId);
    }

    activateSave() {
        this.element
            .querySelector("#saveChangesBtn")
            .classList.remove("deactivated");
        this.saveActivated = true;
    }
    deactivateSave() {
        this.element
            .querySelector("#saveChangesBtn")
            .classList.add("deactivated");
        this.saveActivated = false;
    }

    hideDropDown() {
        this.dropDown.style.display = "none";
    }

    showDropDown() {
        this.dropDown.style.display = null;
    }

    createBellDropDownElement() {
        let bellDropDown = document.createElement("div");
        bellDropDown.className = "bellDropDown";

        let template = document.createElement("div");
        template.className = "bellDropDownTemplate";
        template.innerHTML = `
            <div>
                <label>description : </label>
                <p class="desc_preview" id="desc">
                    DESC
                </p>
            </div>
            <button class="dropDownBtn" id="select-audio-btn">
                Open Audio 
            </button>
            <div class="time_preview" id="time">
                TIME
            </div>
        `;

        template.querySelector("#desc").innerText = this.data.desc;
        template.querySelector(
            "#time"
        ).innerText = `time : ${this.formattedTime12hr}`;
        template
            .querySelector("#select-audio-btn")
            .addEventListener("click", () => {
                shell.showItemInFolder(this.data.audioPath);
            });
        bellDropDown.appendChild(template);
        return bellDropDown;
    }

    createBellElement() {
        // bell quick view
        let bellPreview = document.createElement("div");
        bellPreview.className = "bellPreview";
        let bellName = document.createElement("label");
        bellName.innerText = this.data.name;
        bellName.classList.add("bellName");

        let bellTime = document.createElement("label");
        bellTime.innerText = this.formattedTime12hr;
        bellTime.classList.add("bellTime");

        let bellTools = document.createElement("div");
        bellTools.className = "bellTools";

        let editBell = document.createElement("button");
        editBell.innerHTML = '<i class="material-icons">edit</i>';
        editBell.classList.add("editBell");
        editBell.classList.add("bellToolBtn");
        editBell.addEventListener("click", (e) => {
            this.onEdit(e);
        });

        let deleteBell = document.createElement("button");
        deleteBell.innerHTML = '<i class="material-icons">delete</i>';
        deleteBell.classList.add("deleteBell");
        deleteBell.classList.add("bellToolBtn");
        deleteBell.addEventListener("click", () => {
            this.onDelete();
        });

        let cancelBell = document.createElement("button");
        cancelBell.innerHTML = '<i class="material-icons">cancel</i>';
        cancelBell.classList.add("cancelBell");
        cancelBell.classList.add("bellToolBtn");
        cancelBell.addEventListener("click", (e) => {
            this.onCancel(e);
        });

        let saveChanges = document.createElement("button");
        saveChanges.innerHTML = '<i class="material-icons">save</i>';
        saveChanges.id = "saveChangesBtn";
        saveChanges.classList.add("saveChangesBtn");
        saveChanges.classList.add("bellToolBtn");
        if (!this.saveActivated) {
            saveChanges.classList.add("deactivated");
        }
        saveChanges.addEventListener("click", (e) => {
            if (this.saveActivated) {
                this.onSave(e);
            }
        });

        let dropBell = document.createElement("button");
        dropBell.innerHTML =
            '<i class="material-icons" style="width:24px">arrow_drop_downs</i>';
        dropBell.classList.add("dropBell");
        dropBell.classList.add("hidden");
        dropBell.classList.add("bellToolBtn");
        dropBell.id = "bellDropDown";
        dropBell.addEventListener("click", () => {
            if (this.dropDown.style.display === "none") {
                this.showDropDown();
                dropBell.classList.replace("hidden", "active");
            } else {
                this.hideDropDown();
                dropBell.classList.replace("active", "hidden");
            }
        });
        bellTools.appendChild(cancelBell);
        bellTools.appendChild(deleteBell);
        bellTools.appendChild(editBell);
        bellTools.appendChild(saveChanges);
        bellTools.appendChild(dropBell);
        bellPreview.appendChild(bellTools);
        bellPreview.appendChild(bellName);
        bellPreview.appendChild(bellTime);

        // bell
        var bell = document.createElement("div");
        bell.className = "bell";
        bell.appendChild(bellPreview);
        let dropDown = this.createBellDropDownElement();
        bell.appendChild(dropDown);
        return { bell, dropDown };
    }

    clear() {
        clearTimeout(this.alaramTimeOut);
        clearTimeout(this.bellNotificationTimeOut);
    }

    eta() {
        let nowTime = new Date();
        let eta_ms =
            new Date(
                nowTime.getFullYear(),
                nowTime.getMonth(),
                nowTime.getDate(),
                this.time.hour,
                this.time.minute,
                0,
                0
            ) - nowTime.getTime();
        if (eta_ms < 0) {
            // setting the estimated time to the next day if the time has passed
            eta_ms += 86400000;
        }
        return eta_ms;
    }
}

class bells {
    constructor(bellsArray) {
        this.bellsTable = [];
        this.bellsTable = this.bellsTable.concat(bellsArray);
        this.bells = [];
        this.bellContainer = document.getElementById("bellContainer");

        this.addBellBtn = document.getElementById("addNewFavBtn");

        this.onBellSave = (index, bell) => {};
        this.onBellDelete = (bellsTable) => {};
        this.onBellAdd = (bell) => {};

        this.sorter = (a, b) => {
            return a.eta() - b.eta();
        };

        this.bellEditor = new bellEditor();
        this.bellPlayBackControll = new playBackController();
        this.bellAdder = new bellAdder();

        this.addBellBtn.addEventListener("click", () => {
            this.bellAdder.addBell((data) => {
                if (
                    !deepEqual(
                        data,
                        this.bellsTable[this.bellsTable.length - 1]
                    )
                ) {
                    this.bellsTable.push(data);
                    this.refresh();
                    this.onBellAdd(data);
                }
            });
        });

        for (let bell of this.bellsTable) {
            this.addBell(bell);
        }
        // rendering the bells to the DOM
        this.render();
    }

    sortByName() {
        this.sorter = (a, b) => {
            return a.data.name.localeCompare(b.data.name);
        };
        this.refresh();
    }

    sortByClosest() {
        this.sorter = (a, b) => {
            return a.eta() - b.eta();
        };
        this.refresh();
    }

    setBellAudioOutput(sinkId) {
        for (let bell of this.bells) {
            bell.setSinkId(sinkId);
        }
    }

    setBells(bellsArray) {
        /**
         * setting the bells
         */
        this.bellsTable = bellsArray;
        this.refresh();
    }

    refresh() {
        /**
         * refreshing the bells
         */
        // clearing the bells
        for (let bell of this.bells) {
            bell.clear();
        }
        this.bells = [];
        // clearing the DOM
        document.getElementById("bellContainer").innerHTML = "";
        // adding the bells to the DOM
        for (let bell of this.bellsTable) {
            this.addBell(bell);
        }
        // rendering the bells to the DOM
        this.render();
    }

    render() {
        /**
         * rendering the bells to the DOM
         */
        // sorting the bells to the time
        let sortedWithTime = this.bells.sort((a, b) => {
            return this.sorter(a, b);
        });
        // adding to the DOM
        for (let bell of sortedWithTime) {
            document.getElementById("bellContainer").appendChild(bell.element);
        }
    }

    removeBell(bell) {
        /**
         * removing the bell from the bells
         */
        bell.clear();
        this.bellsTable = this.bellsTable.filter(
            (b) => !deepEqual(b, bell.getJSON())
        );
        this.refresh();
    }

    saveBell(bell) {
        let indexOfBell = this.bells.indexOf(bell);
        this.onBellSave(indexOfBell, bell);
    }

    deleteBell(bell) {
        bell.clear();
        this.bellsTable = this.bellsTable.filter(
            (b) => !deepEqual(b, bell.getJSON())
        );
        this.refresh();
        this.onBellDelete(bell);
    }

    addBell(data) {
        // setting an Alarm to the time
        const alarm = new bell(data.time.hour, data.time.minute, {
            audioPath: data.audioPath,
            name: data.name,
            desc: data.desc,
        });
        if (data.saveActivated) {
            alarm.activateSave();
        }
        alarm.onAlarm = () => {
            this.bellPlayBackControll.playBell(alarm);
        };
        alarm.onSave = () => {
            this.saveBell(alarm);
        };
        alarm.onDelete = () => {
            this.removeBell(alarm);
            this.deleteBell(alarm);
        };

        // when user request a edit to the bell
        alarm.onEdit = (e) => {
            let currentBellPosition = this.bells.indexOf(alarm);
            let currentSettings = this.bellsTable[currentBellPosition];
            this.bellEditor.editBell(alarm, (values) => {
                console.log(values);
                this.bellsTable[currentBellPosition] = {
                    time: {
                        hour:
                            values.time.hour &&
                            typeof values.time.hour === "number"
                                ? values.time.hour
                                : currentSettings.time.hour,
                        minute:
                            values.time.minute &&
                            typeof values.time.minute === "number"
                                ? values.time.minute
                                : currentSettings.time.minute,
                    },
                    audioPath:
                        values.audioPath &&
                        typeof values.audioPath === "string" &&
                        fs.existsSync(values.audioPath)
                            ? values.audioPath
                            : currentSettings.audioPath,
                    name:
                        values.name && typeof values.name === "string"
                            ? values.name
                            : currentSettings.name,
                    desc:
                        values.desc && typeof values.desc === "string"
                            ? values.desc
                            : currentSettings.desc,
                };
                this.refresh();
            });
            this.bellEditor.onClose = () => {
                let newBell = this.bells[currentBellPosition];
                if (
                    !deepEqual(
                        currentSettings,
                        this.bellsTable[currentBellPosition]
                    )
                ) {
                    newBell.activateSave();
                    this.bellsTable[currentBellPosition].saveActivated =
                        newBell.saveActivated;
                }
            };
        };

        alarm.onCancel = (e) => {
            this.removeBell(alarm);
        };
        this.bells.push(alarm);
    }
}

module.exports = {
    bells,
};
