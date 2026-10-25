import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as scenes from './index.js';
import * as windows from '../windows/index.js';

//-----------------------------------------------------------------------------
// Menu
//
// The scene class of the menu screen.
class Menu extends scenes.MenuBase {
    initialize() {
        super.initialize();
    }

    create() {
        super.create();
        this.createCommandWindow();
        this.createGoldWindow();
        this.createStatusWindow();
    }

    start() {
        super.start();
        this._statusWindow.refresh();
    }

    createCommandWindow() {
        this._commandWindow = new windows.MenuCommand(0, 0);
        this._commandWindow.setHandler('item',      this.commandItem.bind(this));
        this._commandWindow.setHandler('skill',     this.commandPersonal.bind(this));
        this._commandWindow.setHandler('equip',     this.commandPersonal.bind(this));
        this._commandWindow.setHandler('status',    this.commandPersonal.bind(this));
        this._commandWindow.setHandler('formation', this.commandFormation.bind(this));
        this._commandWindow.setHandler('options',   this.commandOptions.bind(this));
        this._commandWindow.setHandler('save',      this.commandSave.bind(this));
        this._commandWindow.setHandler('gameEnd',   this.commandGameEnd.bind(this));
        this._commandWindow.setHandler('cancel',    this.popScene.bind(this));
        this.addWindow(this._commandWindow);
    }

    createGoldWindow() {
        this._goldWindow = new windows.Gold(0, 0);
        this._goldWindow.y = core.Graphics.boxHeight - this._goldWindow.height;
        this.addWindow(this._goldWindow);
    }

    createStatusWindow() {
        this._statusWindow = new windows.MenuStatus(this._commandWindow.width, 0);
        this._statusWindow.reserveFaceImages();
        this.addWindow(this._statusWindow);
    }

    commandItem() {
        managers.SceneManager.push(scenes.Item);
    }

    commandPersonal() {
        this._statusWindow.setFormationMode(false);
        this._statusWindow.selectLast();
        this._statusWindow.activate();
        this._statusWindow.setHandler('ok',     this.onPersonalOk.bind(this));
        this._statusWindow.setHandler('cancel', this.onPersonalCancel.bind(this));
    }

    commandFormation() {
        this._statusWindow.setFormationMode(true);
        this._statusWindow.selectLast();
        this._statusWindow.activate();
        this._statusWindow.setHandler('ok',     this.onFormationOk.bind(this));
        this._statusWindow.setHandler('cancel', this.onFormationCancel.bind(this));
    }

    commandOptions() {
        managers.SceneManager.push(scenes.Options);
    }

    commandSave() {
        managers.SceneManager.push(scenes.Save);
    }

    commandGameEnd() {
        managers.SceneManager.push(scenes.GameEnd);
    }

    onPersonalOk() {
        switch (this._commandWindow.currentSymbol()) {
        case 'skill':
            managers.SceneManager.push(scenes.Skill);
            break;
        case 'equip':
            managers.SceneManager.push(scenes.Equip);
            break;
        case 'status':
            managers.SceneManager.push(scenes.Status);
            break;
        }
    }

    onPersonalCancel() {
        this._statusWindow.deselect();
        this._commandWindow.activate();
    }

    onFormationOk() {
        var index = this._statusWindow.index();
        var actor = managers.State.$gameParty.members()[index];
        var pendingIndex = this._statusWindow.pendingIndex();
        if (pendingIndex >= 0) {
            managers.State.$gameParty.swapOrder(index, pendingIndex);
            this._statusWindow.setPendingIndex(-1);
            this._statusWindow.redrawItem(index);
        } else {
            this._statusWindow.setPendingIndex(index);
        }
        this._statusWindow.activate();
    }

    onFormationCancel() {
        if (this._statusWindow.pendingIndex() >= 0) {
            this._statusWindow.setPendingIndex(-1);
            this._statusWindow.activate();
        } else {
            this._statusWindow.deselect();
            this._commandWindow.activate();
        }
    }
}

export {Menu};
