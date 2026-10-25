import * as managers from '../managers/index.js';
import * as scenes from './index.js';
import * as windows from '../windows/index.js';

//-----------------------------------------------------------------------------
// Options
//
// The scene class of the options screen.
class Options extends scenes.MenuBase {
    initialize() {
        super.initialize();
    }

    create() {
        super.create();
        this.createOptionsWindow();
    }

    terminate() {
        super.terminate();
        managers.ConfigManager.save();
    }

    createOptionsWindow() {
        this._optionsWindow = new windows.Options();
        this._optionsWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._optionsWindow);
    }
}

export {Options};
