import * as managers from '../managers/index.js';
import * as scenes from './index.js';
import * as windows from '../windows/index.js';

//-----------------------------------------------------------------------------
// Name
//
// The scene class of the name input screen.
class Name extends scenes.MenuBase {
    initialize() {
        super.initialize();
    }

    prepare(actorId, maxLength) {
        this._actorId = actorId;
        this._maxLength = maxLength;
    }

    create() {
        super.create();
        this._actor = managers.State.$gameActors.actor(this._actorId);
        this.createEditWindow();
        this.createInputWindow();
    }

    start() {
        super.start();
        this._editWindow.refresh();
    }

    createEditWindow() {
        this._editWindow = new windows.NameEdit(this._actor, this._maxLength);
        this.addWindow(this._editWindow);
    }

    createInputWindow() {
        this._inputWindow = new windows.NameInput(this._editWindow);
        this._inputWindow.setHandler('ok', this.onInputOk.bind(this));
        this.addWindow(this._inputWindow);
    }

    onInputOk() {
        this._actor.setName(this._editWindow.name());
        this.popScene();
    }
}

export {Name};
