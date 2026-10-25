import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as scenes from './index.js';
import * as windows from '../windows/index.js';

//-----------------------------------------------------------------------------
// Boot
//
// The scene class for initializing the entire game.
class Boot extends scenes.Base {
    initialize() {
        super.initialize();
        this._startDate = Date.now();
    }

    create() {
        super.create();
        managers.DataManager.loadDatabase();
        managers.ConfigManager.load();
        this.loadSystemWindowImage();
    }

    loadSystemWindowImage() {
        managers.ImageManager.reserveSystem('Window');
    }

    static loadSystemImages() {
        managers.ImageManager.reserveSystem('IconSet');
        managers.ImageManager.reserveSystem('Balloon');
        managers.ImageManager.reserveSystem('Shadow1');
        managers.ImageManager.reserveSystem('Shadow2');
        managers.ImageManager.reserveSystem('Damage');
        managers.ImageManager.reserveSystem('States');
        managers.ImageManager.reserveSystem('Weapons1');
        managers.ImageManager.reserveSystem('Weapons2');
        managers.ImageManager.reserveSystem('Weapons3');
        managers.ImageManager.reserveSystem('ButtonSet');
    }

    isReady() {
        if (super.isReady()) {
            return managers.DataManager.isDatabaseLoaded() && this.isGameFontLoaded();
        } else {
            return false;
        }
    }

    isGameFontLoaded() {
        if (core.Graphics.isFontLoaded('GameFont')) {
            return true;
        } else if (!core.Graphics.canUseCssFontLoading()){
            var elapsed = Date.now() - this._startDate;
            if (elapsed >= 60000) {
                throw new Error('Failed to load GameFont');
            }
        }
    }

    start() {
        super.start();
        managers.SoundManager.preloadImportantSounds();
        if (managers.DataManager.isBattleTest()) {
            managers.DataManager.setupBattleTest();
            managers.SceneManager.goto(scenes.Battle);
        } else if (managers.DataManager.isEventTest()) {
            managers.DataManager.setupEventTest();
            managers.SceneManager.goto(scenes.Map);
        } else {
            this.checkPlayerLocation();
            managers.DataManager.setupNewGame();
            managers.SceneManager.goto(scenes.Title);
            windows.TitleCommand.initCommandPosition();
        }
        this.updateDocumentTitle();
    }

    updateDocumentTitle() {
        document.title = managers.State.$dataSystem.gameTitle;
    }

    checkPlayerLocation() {
        if (managers.State.$dataSystem.startMapId === 0) {
            throw new Error('Player\'s starting position is not set');
        }
    }
}

export {Boot};
