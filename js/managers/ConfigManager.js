import * as managers from './index.js';

//-----------------------------------------------------------------------------
// ConfigManager
//
// The static class that manages the configuration data.
const ConfigManager = {
    alwaysDash: false,

    commandRemember: false,

    get bgmVolume() {
        return managers.AudioManager._bgmVolume;
    },

    set bgmVolume(value) {
        managers.AudioManager.bgmVolume = value;
    },

    get bgsVolume() {
        return managers.AudioManager.bgsVolume;
    },

    set bgsVolume(value) {
        managers.AudioManager.bgsVolume = value;
    },

    get meVolume() {
        return managers.AudioManager.meVolume;
    },

    set meVolume(value) {
        managers.AudioManager.meVolume = value;
    },

    get seVolume() {
        return managers.AudioManager.seVolume;
    },

    set seVolume(value) {
        managers.AudioManager.seVolume = value;
    },

    load() {
        var json;
        var config = {};
        try {
            json = managers.StorageManager.load(-1);
        } catch (e) {
            console.error(e);
        }
        if (json) {
            config = JSON.parse(json);
        }
        this.applyData(config);
    },

    save() {
        managers.StorageManager.save(-1, JSON.stringify(this.makeData()));
    },

    makeData() {
        var config = {};
        config.alwaysDash = this.alwaysDash;
        config.commandRemember = this.commandRemember;
        config.bgmVolume = this.bgmVolume;
        config.bgsVolume = this.bgsVolume;
        config.meVolume = this.meVolume;
        config.seVolume = this.seVolume;
        return config;
    },

    applyData(config) {
        this.alwaysDash = this.readFlag(config, 'alwaysDash');
        this.commandRemember = this.readFlag(config, 'commandRemember');
        this.bgmVolume = this.readVolume(config, 'bgmVolume');
        this.bgsVolume = this.readVolume(config, 'bgsVolume');
        this.meVolume = this.readVolume(config, 'meVolume');
        this.seVolume = this.readVolume(config, 'seVolume');
    },

    readFlag(config, name) {
        return !!config[name];
    },

    readVolume(config, name) {
        var value = config[name];
        if (value !== undefined) {
            return Number(value).clamp(0, 100);
        } else {
            return 100;
        }
    },
};

export {ConfigManager};
