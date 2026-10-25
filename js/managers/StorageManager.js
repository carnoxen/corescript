import * as core from '../core/index.js';

//-----------------------------------------------------------------------------
// StorageManager
//
// The static class that manages storage for saving game data.
const StorageManager = {
    async initialize() {
        if (this.isLocalMode() && !this.fs) {
            [this.fs, this.path] = await Promise.all([import('node:fs'), import('node:path')]);
        }
    },

    save(savefileId, json) {
        if (this.exists(savefileId)) this.load(savefileId);
        if (this.isLocalMode()) {
            this.saveToLocalFile(savefileId, json);
        } else {
            this.saveToWebStorage(savefileId, json);
        }
    },

    load(savefileId) {
        if (this.isLocalMode()) {
            return this.loadFromLocalFile(savefileId);
        } else {
            return this.loadFromWebStorage(savefileId);
        }
    },

    exists(savefileId) {
        if (this.isLocalMode()) {
            return this.localFileExists(savefileId);
        } else {
            return this.webStorageExists(savefileId);
        }
    },

    remove(savefileId) {
        if (this.isLocalMode()) {
            this.removeLocalFile(savefileId);
        } else {
            this.removeWebStorage(savefileId);
        }
    },

    backup(savefileId) {
        if (this.exists(savefileId)) {
            if (this.isLocalMode()) {
                var data = this.loadFromLocalFile(savefileId);
                var compressed = core.SaveCodec.encode(data);
                const fs = this.fs;
                var dirPath = this.localFileDirectoryPath();
                var filePath = this.localFilePath(savefileId) + ".bak";
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath);
                }
                fs.writeFileSync(filePath, compressed);
            } else {
                var data = this.loadFromWebStorage(savefileId);
                var compressed = core.SaveCodec.encode(data);
                var key = this.webStorageKey(savefileId) + "bak";
                localStorage.setItem(key, compressed);
            }
        }
    },

    backupExists(savefileId) {
        if (this.isLocalMode()) {
            return this.localFileBackupExists(savefileId);
        } else {
            return this.webStorageBackupExists(savefileId);
        }
    },

    cleanBackup(savefileId) {
        if (this.backupExists(savefileId)) {
            if (this.isLocalMode()) {
                const fs = this.fs;
                var dirPath = this.localFileDirectoryPath();
                var filePath = this.localFilePath(savefileId);
                fs.unlinkSync(filePath + ".bak");
            } else {
                var key = this.webStorageKey(savefileId);
                localStorage.removeItem(key + "bak");
            }
        }
    },

    restoreBackup(savefileId) {
        if (this.backupExists(savefileId)) {
            if (this.isLocalMode()) {
                var data = this.loadFromLocalBackupFile(savefileId);
                var compressed = core.SaveCodec.encode(data);
                const fs = this.fs;
                var dirPath = this.localFileDirectoryPath();
                var filePath = this.localFilePath(savefileId);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath);
                }
                fs.writeFileSync(filePath, compressed);
                fs.unlinkSync(filePath + ".bak");
            } else {
                var data = this.loadFromWebStorageBackup(savefileId);
                var compressed = core.SaveCodec.encode(data);
                var key = this.webStorageKey(savefileId);
                localStorage.setItem(key, compressed);
                localStorage.removeItem(key + "bak");
            }
        }
    },

    isLocalMode() {
        return core.Utils.isNwjs();
    },

    saveToLocalFile(savefileId, json) {
        var data = core.SaveCodec.encode(json);
        const fs = this.fs;
        var dirPath = this.localFileDirectoryPath();
        var filePath = this.localFilePath(savefileId);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
        fs.writeFileSync(filePath, data);
    },

    loadFromLocalFile(savefileId) {
        var data = null;
        const fs = this.fs;
        var filePath = this.localFilePath(savefileId);
        if (fs.existsSync(filePath)) {
            data = fs.readFileSync(filePath, { encoding: 'utf8' });
        }
        return core.SaveCodec.decode(data);
    },

    loadFromLocalBackupFile(savefileId) {
        var data = null;
        const fs = this.fs;
        var filePath = this.localFilePath(savefileId) + ".bak";
        if (fs.existsSync(filePath)) {
            data = fs.readFileSync(filePath, { encoding: 'utf8' });
        }
        return core.SaveCodec.decode(data);
    },

    localFileBackupExists(savefileId) {
        const fs = this.fs;
        return fs.existsSync(this.localFilePath(savefileId) + ".bak");
    },

    localFileExists(savefileId) {
        const fs = this.fs;
        return fs.existsSync(this.localFilePath(savefileId));
    },

    removeLocalFile(savefileId) {
        const fs = this.fs;
        var filePath = this.localFilePath(savefileId);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    },

    saveToWebStorage(savefileId, json) {
        var key = this.webStorageKey(savefileId);
        var data = core.SaveCodec.encode(json);
        localStorage.setItem(key, data);
    },

    loadFromWebStorage(savefileId) {
        var key = this.webStorageKey(savefileId);
        var data = localStorage.getItem(key);
        return core.SaveCodec.decode(data);
    },

    loadFromWebStorageBackup(savefileId) {
        var key = this.webStorageKey(savefileId) + "bak";
        var data = localStorage.getItem(key);
        return core.SaveCodec.decode(data);
    },

    webStorageBackupExists(savefileId) {
        var key = this.webStorageKey(savefileId) + "bak";
        return !!localStorage.getItem(key);
    },

    webStorageExists(savefileId) {
        var key = this.webStorageKey(savefileId);
        return !!localStorage.getItem(key);
    },

    removeWebStorage(savefileId) {
        var key = this.webStorageKey(savefileId);
        localStorage.removeItem(key);
    },

    localFileDirectoryPath() {
        const path = this.path;

        var base = path.dirname((process.mainModule?.filename ?? this.path.join(nw.App.startPath, 'index.html')));
        if (this.canMakeWwwSaveDirectory()) {
            return path.join(base, 'save/');
        } else {
            return path.join(path.dirname(base), 'save/');
        }
    },

    localFilePath(savefileId) {
        var name;
        if (savefileId < 0) {
            name = 'config.rpgsave';
        } else if (savefileId === 0) {
            name = 'global.rpgsave';
        } else {
            name = 'file%1.rpgsave'.format(savefileId);
        }
        return this.localFileDirectoryPath() + name;
    },

    webStorageKey(savefileId) {
        if (savefileId < 0) {
            return 'RPG Config';
        } else if (savefileId === 0) {
            return 'RPG Global';
        } else {
            return 'RPG File%1'.format(savefileId);
        }
    },

    // Enigma Virtual Box cannot make www/save directory
    canMakeWwwSaveDirectory() {
        if (this._canMakeWwwSaveDirectory === undefined) {
            const fs = this.fs;
            const path = this.path;
            var base = path.dirname((process.mainModule?.filename ?? this.path.join(nw.App.startPath, 'index.html')));
            var testPath = path.join(base, 'testDirectory/');
            try {
                fs.mkdirSync(testPath);
                fs.rmdirSync(testPath);
                this._canMakeWwwSaveDirectory = true;
            } catch (e) {
                this._canMakeWwwSaveDirectory = false;
            }
        }
        return this._canMakeWwwSaveDirectory;
    },
};

export {StorageManager};
