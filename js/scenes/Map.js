import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as scenes from './index.js';
import * as sets from '../sprites/sets/index.js';
import * as windows from '../windows/index.js';

//-----------------------------------------------------------------------------
// Map
//
// The scene class of the map screen.
class Map extends scenes.Base {
    initialize() {
        super.initialize();
        this._waitCount = 0;
        this._encounterEffectDuration = 0;
        this._mapLoaded = false;
        this._touchCount = 0;
    }

    create() {
        super.create();
        this._transfer = managers.State.$gamePlayer.isTransferring();
        var mapId = this._transfer ? managers.State.$gamePlayer.newMapId() : managers.State.$gameMap.mapId();
        managers.DataManager.loadMapData(mapId);
    }

    isReady() {
        if (!this._mapLoaded && managers.DataManager.isMapLoaded()) {
            this.onMapLoaded();
            this._mapLoaded = true;
        }
        return this._mapLoaded && super.isReady();
    }

    onMapLoaded() {
        if (this._transfer) {
            managers.State.$gamePlayer.performTransfer();
        }
        this.createDisplayObjects();
    }

    start() {
        super.start();
        managers.SceneManager.clearStack();
        if (this._transfer) {
            this.fadeInForTransfer();
            this._mapNameWindow.open();
            managers.State.$gameMap.autoplay();
        } else if (this.needsFadeIn()) {
            this.startFadeIn(this.fadeSpeed(), false);
        }
        this.menuCalling = false;
    }

    update() {
        this.updateDestination();
        this.updateMainMultiply();
        if (this.isSceneChangeOk()) {
            this.updateScene();
        } else if (managers.SceneManager.isNextScene(scenes.Battle)) {
            this.updateEncounterEffect();
        }
        this.updateWaitCount();
        super.update();
    }

    updateMainMultiply() {
        this.updateMain();
        if (this.isFastForward()) {
            if (!this.isMapTouchOk()) {
                this.updateDestination();
            }
            this.updateMain();
        }
    }

    updateMain() {
        var active = this.isActive();
        managers.State.$gameMap.update(active);
        managers.State.$gamePlayer.update(active);
        managers.State.$gameTimer.update(active);
        managers.State.$gameScreen.update();
    }

    isFastForward() {
        return (managers.State.$gameMap.isEventRunning() && !managers.SceneManager.isSceneChanging() &&
                (core.Input.isLongPressed('ok') || core.TouchInput.isLongPressed()));
    }

    stop() {
        super.stop();
        managers.State.$gamePlayer.straighten();
        this._mapNameWindow.close();
        if (this.needsSlowFadeOut()) {
            this.startFadeOut(this.slowFadeSpeed(), false);
        } else if (managers.SceneManager.isNextScene(Map)) {
            this.fadeOutForTransfer();
        } else if (managers.SceneManager.isNextScene(scenes.Battle)) {
            this.launchBattle();
        }
    }

    isBusy() {
        return ((this._messageWindow && this._messageWindow.isClosing()) ||
                this._waitCount > 0 || this._encounterEffectDuration > 0 ||
                super.isBusy());
    }

    terminate() {
        super.terminate();
        if (!managers.SceneManager.isNextScene(scenes.Battle)) {
            this._spriteset.update();
            this._mapNameWindow.hide();
            managers.SceneManager.snapForBackground();
        } else {
            managers.ImageManager.clearRequest();
        }

        if (managers.SceneManager.isNextScene(Map)) {
            managers.ImageManager.clearRequest();
        }

        managers.State.$gameScreen.clearZoom();

        this.removeChild(this._fadeSprite);
        this.removeChild(this._mapNameWindow);
        this.removeChild(this._windowLayer);
        this.removeChild(this._spriteset);
    }

    needsFadeIn() {
        return (managers.SceneManager.isPreviousScene(scenes.Battle) ||
                managers.SceneManager.isPreviousScene(scenes.Load));
    }

    needsSlowFadeOut() {
        return (managers.SceneManager.isNextScene(scenes.Title) ||
                managers.SceneManager.isNextScene(scenes.Gameover));
    }

    updateWaitCount() {
        if (this._waitCount > 0) {
            this._waitCount--;
            return true;
        }
        return false;
    }

    updateDestination() {
        if (this.isMapTouchOk()) {
            this.processMapTouch();
        } else {
            managers.State.$gameTemp.clearDestination();
            this._touchCount = 0;
        }
    }

    isMapTouchOk() {
        return this.isActive() && managers.State.$gamePlayer.canMove();
    }

    processMapTouch() {
        if (core.TouchInput.isTriggered() || this._touchCount > 0) {
            if (core.TouchInput.isPressed()) {
                if (this._touchCount === 0 || this._touchCount >= 15) {
                    var x = managers.State.$gameMap.canvasToMapX(core.TouchInput.x);
                    var y = managers.State.$gameMap.canvasToMapY(core.TouchInput.y);
                    managers.State.$gameTemp.setDestination(x, y);
                }
                this._touchCount++;
            } else {
                this._touchCount = 0;
            }
        }
    }

    isSceneChangeOk() {
        return this.isActive() && !managers.State.$gameMessage.isBusy();
    }

    updateScene() {
        this.checkGameover();
        if (!managers.SceneManager.isSceneChanging()) {
            this.updateTransferPlayer();
        }
        if (!managers.SceneManager.isSceneChanging()) {
            this.updateEncounter();
        }
        if (!managers.SceneManager.isSceneChanging()) {
            this.updateCallMenu();
        }
        if (!managers.SceneManager.isSceneChanging()) {
            this.updateCallDebug();
        }
    }

    createDisplayObjects() {
        this.createSpriteset();
        this.createMapNameWindow();
        this.createWindowLayer();
        this.createAllWindows();
    }

    createSpriteset() {
        this._spriteset = new sets.Map();
        this.addChild(this._spriteset);
    }

    createAllWindows() {
        this.createMessageWindow();
        this.createScrollTextWindow();
    }

    createMapNameWindow() {
        this._mapNameWindow = new windows.MapName();
        this.addChild(this._mapNameWindow);
    }

    createMessageWindow() {
        this._messageWindow = new windows.Message();
        this.addWindow(this._messageWindow);
        this._messageWindow.subWindows().forEach(function(window) {
            this.addWindow(window);
        }, this);
    }

    createScrollTextWindow() {
        this._scrollTextWindow = new windows.ScrollText();
        this.addWindow(this._scrollTextWindow);
    }

    updateTransferPlayer() {
        if (managers.State.$gamePlayer.isTransferring()) {
            managers.SceneManager.goto(Map);
        }
    }

    updateEncounter() {
       if (managers.State.$gamePlayer.executeEncounter()) {
           managers.SceneManager.push(scenes.Battle);
       }
    }

    updateCallMenu() {
        if (this.isMenuEnabled()) {
            if (this.isMenuCalled()) {
                this.menuCalling = true;
            }
            if (this.menuCalling && !managers.State.$gamePlayer.isMoving()) {
                this.callMenu();
            }
        } else {
            this.menuCalling = false;
        }
    }

    isMenuEnabled() {
        return managers.State.$gameSystem.isMenuEnabled() && !managers.State.$gameMap.isEventRunning();
    }

    isMenuCalled() {
        return core.Input.isTriggered('menu') || core.TouchInput.isCancelled();
    }

    callMenu() {
        managers.SoundManager.playOk();
        managers.SceneManager.push(scenes.Menu);
        windows.MenuCommand.initCommandPosition();
        managers.State.$gameTemp.clearDestination();
        this._mapNameWindow.hide();
        this._waitCount = 2;
    }

    updateCallDebug() {
        if (this.isDebugCalled()) {
            managers.SceneManager.push(scenes.Debug);
        }
    }

    isDebugCalled() {
        return core.Input.isTriggered('debug') && managers.State.$gameTemp.isPlaytest();
    }

    fadeInForTransfer() {
        var fadeType = managers.State.$gamePlayer.fadeType();
        switch (fadeType) {
        case 0: case 1:
            this.startFadeIn(this.fadeSpeed(), fadeType === 1);
            break;
        }
    }

    fadeOutForTransfer() {
        var fadeType = managers.State.$gamePlayer.fadeType();
        switch (fadeType) {
        case 0: case 1:
            this.startFadeOut(this.fadeSpeed(), fadeType === 1);
            break;
        }
    }

    launchBattle() {
        managers.BattleManager.saveBgmAndBgs();
        this.stopAudioOnBattleStart();
        managers.SoundManager.playBattleStart();
        this.startEncounterEffect();
        this._mapNameWindow.hide();
    }

    stopAudioOnBattleStart() {
        if (!managers.AudioManager.isCurrentBgm(managers.State.$gameSystem.battleBgm())) {
            managers.AudioManager.stopBgm();
        }
        managers.AudioManager.stopBgs();
        managers.AudioManager.stopMe();
        managers.AudioManager.stopSe();
    }

    startEncounterEffect() {
        this._spriteset.hideCharacters();
        this._encounterEffectDuration = this.encounterEffectSpeed();
    }

    updateEncounterEffect() {
        if (this._encounterEffectDuration > 0) {
            this._encounterEffectDuration--;
            var speed = this.encounterEffectSpeed();
            var n = speed - this._encounterEffectDuration;
            var p = n / speed;
            var q = ((p - 1) * 20 * p + 5) * p + 1;
            var zoomX = managers.State.$gamePlayer.screenX();
            var zoomY = managers.State.$gamePlayer.screenY() - 24;
            if (n === 2) {
                managers.State.$gameScreen.setZoom(zoomX, zoomY, 1);
                this.snapForBattleBackground();
                this.startFlashForEncounter(speed / 2);
            }
            managers.State.$gameScreen.setZoom(zoomX, zoomY, q);
            if (n === Math.floor(speed / 6)) {
                this.startFlashForEncounter(speed / 2);
            }
            if (n === Math.floor(speed / 2)) {
                managers.BattleManager.playBattleBgm();
                this.startFadeOut(this.fadeSpeed());
            }
        }
    }

    snapForBattleBackground() {
        this._windowLayer.visible = false;
        managers.SceneManager.snapForBackground();
        this._windowLayer.visible = true;
    }

    startFlashForEncounter(duration) {
        var color = [255, 255, 255, 255];
        managers.State.$gameScreen.startFlash(color, duration);
    }

    encounterEffectSpeed() {
        return 60;
    }
}

export {Map};
