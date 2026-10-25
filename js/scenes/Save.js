import * as managers from '../managers/index.js';
import * as scenes from './index.js';

//-----------------------------------------------------------------------------
// Save
//
// The scene class of the save screen.
class Save extends scenes.File {
    initialize() {
        super.initialize();
    }

    mode() {
        return 'save';
    }

    helpWindowText() {
        return managers.TextManager.saveMessage;
    }

    firstSavefileIndex() {
        return managers.DataManager.lastAccessedSavefileId() - 1;
    }

    onSavefileOk() {
        if (managers.DataManager.isAutoSaveFileId(this.savefileId())) {
            this.onSaveFailure();
            return;
        }
        super.onSavefileOk();
        managers.State.$gameSystem.onBeforeSave();
        if (managers.DataManager.saveGame(this.savefileId())) {
            this.onSaveSuccess();
        } else {
            this.onSaveFailure();
        }
    }

    onSaveSuccess() {
        managers.SoundManager.playSave();
        managers.StorageManager.cleanBackup(this.savefileId());
        this.popScene();
    }

    onSaveFailure() {
        managers.SoundManager.playBuzzer();
        this.activateListWindow();
    }
}

export {Save};
