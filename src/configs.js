const fs = require("fs");
const path = require("path");
const _ = require("lodash");

class JSON_Config {
    constructor(pathToConfig) {
        this.pathToConfig = path.resolve(__dirname, pathToConfig);
        this.config = {};

        fs.watchFile(this.pathToConfig, (curr, prev) => {
            if (this.diffCalcOnChange(curr, prev)) {
                this.readConfig();
            } else {
                this.writeToConfig(this.config);
            }
        });
    }

    validateConfig(config) {
        // validates the config file (example : if its empty or not a json)
        try {
            JSON.parse(config);
        } catch (e) {
            return false;
        }
        return true;
    }

    diffCalcOnChange(curr, prev) {
        /**
         * @param {fs.Stats} curr current file stats
         * @param {fs.Stats} prev previous file stats
         */

        // if we return true the configs will update otherwise it wont
        let data = fs.readFileSync(this.pathToConfig, "utf8");
        if (
            this.validateConfig(data) &&
            !_.isEqual(this.config, JSON.parse(data))
        ) {
            return true;
        }
        return false;
    }

    writeToConfig(config) {
        fs.writeFileSync(
            this.pathToConfig,
            JSON.stringify(config, null, 4),
            "utf8"
        );
    }
    readConfig() {
        if (fs.existsSync(this.pathToConfig)) {
            let content = fs.readFileSync(this.pathToConfig, "utf8");
            if (this.validateConfig(content)) {
                this.config = JSON.parse(content);
            } else {
                // writing the existing config to the file if validate fails
                this.writeToConfig(this.config);
            }
        } else {
            this.writeToConfig(this.config);
            this.readConfig();
        }
        return this.config;
    }

    setKey(key, value) {
        this.config[key] = value;
        this.writeToConfig(this.config);
    }

    removeKey(key) {
        delete this.config[key];
        this.writeToConfig(this.config);
    }

    getKeyValue(key) {
        return this.config[key];
    }
}

class settingsConfig extends JSON_Config {
    constructor(pathToConfig) {
        super(pathToConfig);
        this.config = {
            runInBackgroundWhenClosed: true,
            autoLaunchInStartup: false,
        };
        this.readConfig();
    }

    getAutoLaunchInStartup() {
        return this.getKeyValue("autoLaunchInStartup");
    }

    setAutoLaunchInStartup(value) {
        this.setKey("autoLaunchInStartup", value);
    }

    setBackgroundWhenClosed(value) {
        this.setKey("runInBackgroundWhenClosed", value);
    }

    getBackgroundWhenClosed() {
        return this.getKeyValue("runInBackgroundWhenClosed");
    }
}

class bellsConfig extends JSON_Config {
    constructor(pathToConfig) {
        super(pathToConfig);
        this.config = {
            bells: [],
        };
        this.readBells();
    }

    addBell(bell) {
        this.config.bells.push(bell);
        this.writeToConfig(this.config);
    }

    removeBell(bell) {
        this.config.bells = this.config.bells.filter((b) => b !== bell);
        this.writeToConfig(this.config);
    }

    setBell(index, bell) {
        this.config.bells[index] = bell;
        this.writeToConfig(this.config);
    }

    getBells() {
        return this.config.bells;
    }

    readBells() {
        this.readConfig();
        this.config.bells.map((bell) => {
            bell.audioPath = path.resolve(bell.audioPath);
            return bell;
        });

        return this.config.bells;
    }
}

module.exports = {
    JSON_Config,
    settingsConfig,
    bellsConfig,
};
