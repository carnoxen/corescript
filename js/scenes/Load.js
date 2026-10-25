import * as managers from '../managers/index.js';
import * as scenes from './index.js';

//-----------------------------------------------------------------------------
// Load
//
// The scene class of the load screen.
class Load extends scenes.File {
    initialize() {
        super.initialize();
        this._loadSuccess = false;
    }

    terminate() {
        super.terminate();
        if (this._loadSuccess) {
            managers.State.$gameSystem.onAfterLoad();
        }
    }

    mode() {
        return 'load';
    }

    helpWindowText() {
        return managers.TextManager.loadMessage;
    }

    firstSavefileIndex() {
        return managers.DataManager.latestSavefileId() - 1;
    }

    onSavefileOk() {
        super.onSavefileOk();
        if (managers.DataManager.loadGame(this.savefileId())) {
            this.onLoadSuccess();
        } else {
            this.onLoadFailure();
        }
    }

    onLoadSuccess() {
        managers.SoundManager.playLoad();
        this.fadeOutAll();
        this.reloadMapIfUpdated();
        managers.SceneManager.goto(scenes.Map);
        this._loadSuccess = true;
    }

    onLoadFailure() {
        managers.SoundManager.playBuzzer();
        this.activateListWindow();
    }

    reloadMapIfUpdated() {
        if (managers.State.$gameSystem.versionId() !== managers.State.$dataSystem.versionId) {
            managers.State.$gamePlayer.reserveTransfer(managers.State.$gameMap.mapId(), managers.State.$gamePlayer.x, managers.State.$gamePlayer.y);
            managers.State.$gamePlayer.requestMapReload();
        }
    }
}

export {Load};
