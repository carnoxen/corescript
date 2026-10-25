import * as scenes from './index.js';
import * as windows from '../windows/index.js';

//-----------------------------------------------------------------------------
// Status
//
// The scene class of the status screen.
class Status extends scenes.MenuBase {
    initialize() {
        super.initialize();
    }

    create() {
        super.create();
        this._statusWindow = new windows.Status();
        this._statusWindow.setHandler('cancel',   this.popScene.bind(this));
        this._statusWindow.setHandler('pagedown', this.nextActor.bind(this));
        this._statusWindow.setHandler('pageup',   this.previousActor.bind(this));
        this._statusWindow.reserveFaceImages();
        this.addWindow(this._statusWindow);
    }

    start() {
        super.start();
        this.refreshActor();
    }

    refreshActor() {
        var actor = this.actor();
        this._statusWindow.setActor(actor);
    }

    onActorChange() {
        this.refreshActor();
        this._statusWindow.activate();
    }
}

export {Status};
