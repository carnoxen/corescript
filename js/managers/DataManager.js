import * as core from '../core/index.js';
import * as managers from './index.js';
import * as objects from '../objects/index.js';
import * as scenes from '../scenes/index.js';

//-----------------------------------------------------------------------------
// DataManager
//
// The static class that manages the database and game objects.
const DataManager = {
    _globalId: 'RPGMV',

    _lastAccessedId: 1,

    _errorUrl: null,

    _autoSaveFileId: 0,

    _databaseFiles: [
        { name: '$dataActors',       src: 'Actors.json'       },
        { name: '$dataClasses',      src: 'Classes.json'      },
        { name: '$dataSkills',       src: 'Skills.json'       },
        { name: '$dataItems',        src: 'Items.json'        },
        { name: '$dataWeapons',      src: 'Weapons.json'      },
        { name: '$dataArmors',       src: 'Armors.json'       },
        { name: '$dataEnemies',      src: 'Enemies.json'      },
        { name: '$dataTroops',       src: 'Troops.json'       },
        { name: '$dataStates',       src: 'States.json'       },
        { name: '$dataAnimations',   src: 'Animations.json'   },
        { name: '$dataTilesets',     src: 'Tilesets.json'     },
        { name: '$dataCommonEvents', src: 'CommonEvents.json' },
        { name: '$dataSystem',       src: 'System.json'       },
        { name: '$dataMapInfos',     src: 'MapInfos.json'     }
    ],

    loadDatabase() {
        var test = this.isBattleTest() || this.isEventTest();
        var prefix = test ? 'Test_' : '';
        for (var i = 0; i < this._databaseFiles.length; i++) {
            var name = this._databaseFiles[i].name;
            var src = this._databaseFiles[i].src;
            this.loadDataFile(name, prefix + src);
        }
        if (this.isEventTest()) {
            this.loadDataFile('$testEvent', prefix + 'Event.json');
        }
    },

    loadDataFile(name, src) {
        var xhr = new XMLHttpRequest();
        var url = 'data/' + src;
        xhr.open('GET', url);
        xhr.overrideMimeType('application/json');
        xhr.onload = function() {
            if (xhr.status < 400) {
                managers.State[name] = JSON.parse(xhr.responseText);
                DataManager.onLoad(managers.State[name]);
            }
        };
        xhr.onerror = this._mapLoader || function() {
            DataManager._errorUrl = DataManager._errorUrl || url;
        };
        managers.State[name] = null;
        xhr.send();
    },

    isDatabaseLoaded() {
        this.checkError();
        for (var i = 0; i < this._databaseFiles.length; i++) {
            if (!managers.State[this._databaseFiles[i].name]) {
                return false;
            }
        }
        return true;
    },

    loadMapData(mapId) {
        if (mapId > 0) {
            var filename = 'Map%1.json'.format(mapId.padZero(3));
            this._mapLoader = core.ResourceHandler.createLoader('data/' + filename, this.loadDataFile.bind(this, '$dataMap', filename));
            this.loadDataFile('$dataMap', filename);
        } else {
            this.makeEmptyMap();
        }
    },

    makeEmptyMap() {
        managers.State.$dataMap = {};
        managers.State.$dataMap.data = [];
        managers.State.$dataMap.events = [];
        managers.State.$dataMap.width = 100;
        managers.State.$dataMap.height = 100;
        managers.State.$dataMap.scrollType = 3;
    },

    isMapLoaded() {
        this.checkError();
        return !!managers.State.$dataMap;
    },

    onLoad(object) {
        var array;
        if (object === managers.State.$dataMap) {
            this.extractMetadata(object);
            array = object.events;
        } else {
            array = object;
        }
        if (Array.isArray(array)) {
            for (var i = 0; i < array.length; i++) {
                var data = array[i];
                if (data && data.note !== undefined) {
                    this.extractMetadata(data);
                }
            }
        }
        if (object === managers.State.$dataSystem) {
            core.Decrypter.hasEncryptedImages = !!object.hasEncryptedImages;
            core.Decrypter.hasEncryptedAudio = !!object.hasEncryptedAudio;
            scenes.Boot.loadSystemImages();
        }
    },

    extractMetadata(data) {
        var re = /<([^<>:]+)(:?)([^>]*)>/g;
        data.meta = {};
        for (;;) {
            var match = re.exec(data.note);
            if (match) {
                if (match[2] === ':') {
                    data.meta[match[1]] = match[3];
                } else {
                    data.meta[match[1]] = true;
                }
            } else {
                break;
            }
        }
    },

    checkError() {
        if (DataManager._errorUrl) {
            throw new Error('Failed to load: ' + DataManager._errorUrl);
        }
    },

    isBattleTest() {
        return core.Utils.isOptionValid('btest');
    },

    isEventTest() {
        return core.Utils.isOptionValid('etest');
    },

    isSkill(item) {
        return item && managers.State.$dataSkills.contains(item);
    },

    isItem(item) {
        return item && managers.State.$dataItems.contains(item);
    },

    isWeapon(item) {
        return item && managers.State.$dataWeapons.contains(item);
    },

    isArmor(item) {
        return item && managers.State.$dataArmors.contains(item);
    },

    createGameObjects() {
        managers.State.$gameTemp          = new objects.Temp();
        managers.State.$gameSystem        = new objects.System();
        managers.State.$gameScreen        = new objects.Screen();
        managers.State.$gameTimer         = new objects.Timer();
        managers.State.$gameMessage       = new objects.Message();
        managers.State.$gameSwitches      = new objects.Switches();
        managers.State.$gameVariables     = new objects.Variables();
        managers.State.$gameSelfSwitches  = new objects.SelfSwitches();
        managers.State.$gameActors        = new objects.Actors();
        managers.State.$gameParty         = new objects.Party();
        managers.State.$gameTroop         = new objects.Troop();
        managers.State.$gameMap           = new objects.Map();
        managers.State.$gamePlayer        = new objects.Player();
    },

    setupNewGame() {
        this.createGameObjects();
        this.selectSavefileForNewGame();
        managers.State.$gameParty.setupStartingMembers();
        managers.State.$gamePlayer.reserveTransfer(managers.State.$dataSystem.startMapId,
            managers.State.$dataSystem.startX, managers.State.$dataSystem.startY);
        core.Graphics.frameCount = 0;
        managers.SceneManager.resetFrameCount();
    },

    setupBattleTest() {
        this.createGameObjects();
        managers.State.$gameParty.setupBattleTest();
        managers.BattleManager.setup(managers.State.$dataSystem.testTroopId, true, false);
        managers.BattleManager.setBattleTest(true);
        managers.BattleManager.playBattleBgm();
    },

    setupEventTest() {
        this.createGameObjects();
        this.selectSavefileForNewGame();
        managers.State.$gameParty.setupStartingMembers();
        managers.State.$gamePlayer.reserveTransfer(-1, 8, 6);
        managers.State.$gamePlayer.setTransparent(false);
    },

    loadGlobalInfo() {
        if (this._globalInfo) {
            return this._globalInfo;
        }
        var json;
        try {
            json = managers.StorageManager.load(0);
        } catch (e) {
            console.error(e);
            return [];
        }
        if (json) {
            this._globalInfo = JSON.parse(json);
            for (var i = 1; i <= this.maxSavefiles(); i++) {
                if (!managers.StorageManager.exists(i)) {
                    delete this._globalInfo[i];
                }
            }
            return this._globalInfo;
        } else {
            return this._globalInfo = [];
        }
    },

    saveGlobalInfo(info) {
        this._globalInfo = null;
        managers.StorageManager.save(0, JSON.stringify(info));
    },

    isThisGameFile(savefileId) {
        var globalInfo = this.loadGlobalInfo();
        if (globalInfo && globalInfo[savefileId]) {
            if (managers.StorageManager.isLocalMode()) {
                return true;
            } else {
                var savefile = globalInfo[savefileId];
                return (savefile.globalId === this._globalId &&
                        savefile.title === managers.State.$dataSystem.gameTitle);
            }
        } else {
            return false;
        }
    },

    isAnySavefileExists() {
        var globalInfo = this.loadGlobalInfo();
        if (globalInfo) {
            for (var i = 1; i < globalInfo.length; i++) {
                if (this.isThisGameFile(i)) {
                    return true;
                }
            }
        }
        return false;
    },

    latestSavefileId() {
        var globalInfo = this.loadGlobalInfo();
        var savefileId = 1;
        var timestamp = 0;
        if (globalInfo) {
            for (var i = 1; i < globalInfo.length; i++) {
                if (this.isThisGameFile(i) && globalInfo[i].timestamp > timestamp) {
                    timestamp = globalInfo[i].timestamp;
                    savefileId = i;
                }
            }
        }
        return savefileId;
    },

    loadAllSavefileImages() {
        var globalInfo = this.loadGlobalInfo();
        if (globalInfo) {
            for (var i = 1; i < globalInfo.length; i++) {
                if (this.isThisGameFile(i)) {
                    var info = globalInfo[i];
                    this.loadSavefileImages(info);
                }
            }
        }
    },

    loadSavefileImages(info) {
        if (info.characters) {
            for (var i = 0; i < info.characters.length; i++) {
                managers.ImageManager.reserveCharacter(info.characters[i][0]);
            }
        }
        if (info.faces) {
            for (var j = 0; j < info.faces.length; j++) {
                managers.ImageManager.reserveFace(info.faces[j][0]);
            }
        }
    },

    maxSavefiles() {
        return 20;
    },

    saveGame(savefileId) {
        let backupComplete = false;
        try {
            managers.StorageManager.backup(savefileId);
            backupComplete = true;
            return this.saveGameWithoutRescue(savefileId);
        } catch (e) {
            console.error(e);
            try {
                if (backupComplete) {
                    managers.StorageManager.remove(savefileId);
                    managers.StorageManager.restoreBackup(savefileId);
                }
            } catch (e2) {
            }
            return false;
        }
    },

    loadGame(savefileId) {
        try {
            return this.loadGameWithoutRescue(savefileId);
        } catch (e) {
            console.error(e);
            return false;
        }
    },

    loadSavefileInfo(savefileId) {
        var globalInfo = this.loadGlobalInfo();
        return (globalInfo && globalInfo[savefileId]) ? globalInfo[savefileId] : null;
    },

    lastAccessedSavefileId() {
        return this._lastAccessedId;
    },

    saveGameWithoutRescue(savefileId) {
        var json = core.JsonEx.stringify(this.makeSaveContents());
        if (json.length >= 200000) {
            console.warn('Save data too big!');
        }
        managers.StorageManager.save(savefileId, json);
        this._lastAccessedId = savefileId;
        var globalInfo = this.loadGlobalInfo() || [];
        globalInfo[savefileId] = this.makeSavefileInfo();
        this.saveGlobalInfo(globalInfo);
        return true;
    },

    loadGameWithoutRescue(savefileId) {
        if (this.isThisGameFile(savefileId)) {
            var json = managers.StorageManager.load(savefileId);
            this.createGameObjects();
            this.extractSaveContents(core.JsonEx.parse(json));
            this._lastAccessedId = savefileId;
            return true;
        } else {
            return false;
        }
    },

    selectSavefileForNewGame() {
        var globalInfo = this.loadGlobalInfo();
        this._lastAccessedId = 1;
        if (globalInfo) {
            var numSavefiles = Math.max(0, globalInfo.length - 1);
            if (numSavefiles < this.maxSavefiles()) {
                this._lastAccessedId = numSavefiles + 1;
            } else {
                var timestamp = Number.MAX_VALUE;
                for (var i = 1; i < globalInfo.length; i++) {
                    if (!globalInfo[i]) {
                        this._lastAccessedId = i;
                        break;
                    }
                    if (globalInfo[i].timestamp < timestamp) {
                        timestamp = globalInfo[i].timestamp;
                        this._lastAccessedId = i;
                    }
                }
            }
        }
    },

    makeSavefileInfo() {
        var info = {};
        info.globalId   = this._globalId;
        info.title      = managers.State.$dataSystem.gameTitle;
        info.characters = managers.State.$gameParty.charactersForSavefile();
        info.faces      = managers.State.$gameParty.facesForSavefile();
        info.playtime   = managers.State.$gameSystem.playtimeText();
        info.timestamp  = Date.now();
        return info;
    },

    makeSaveContents() {
        // A save data does not contain $gameTemp, $gameMessage, and $gameTroop.
        var contents = {};
        contents.system       = managers.State.$gameSystem;
        contents.screen       = managers.State.$gameScreen;
        contents.timer        = managers.State.$gameTimer;
        contents.switches     = managers.State.$gameSwitches;
        contents.variables    = managers.State.$gameVariables;
        contents.selfSwitches = managers.State.$gameSelfSwitches;
        contents.actors       = managers.State.$gameActors;
        contents.party        = managers.State.$gameParty;
        contents.map          = managers.State.$gameMap;
        contents.player       = managers.State.$gamePlayer;
        return contents;
    },

    extractSaveContents(contents) {
        managers.State.$gameSystem        = contents.system;
        managers.State.$gameScreen        = contents.screen;
        managers.State.$gameTimer         = contents.timer;
        managers.State.$gameSwitches      = contents.switches;
        managers.State.$gameVariables     = contents.variables;
        managers.State.$gameSelfSwitches  = contents.selfSwitches;
        managers.State.$gameActors        = contents.actors;
        managers.State.$gameParty         = contents.party;
        managers.State.$gameMap           = contents.map;
        managers.State.$gamePlayer        = contents.player;
    },

    setAutoSaveFileId(autoSaveFileId) {
        this._autoSaveFileId = autoSaveFileId;
    },

    isAutoSaveFileId(saveFileId) {
        return this._autoSaveFileId !== 0 && this._autoSaveFileId === saveFileId;
    },

    autoSaveGame() {
        if (this._autoSaveFileId !== 0 && !this.isEventTest() && managers.State.$gameSystem.isSaveEnabled()) {
            managers.State.$gameSystem.onBeforeSave();
            if (this.saveGame(this._autoSaveFileId)) {
                managers.StorageManager.cleanBackup(this._autoSaveFileId);
            }
        }
    },
};

export {DataManager};
