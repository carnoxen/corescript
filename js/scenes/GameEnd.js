import * as managers from '../managers/index.js';
import * as scenes from './index.js';
import * as windows from '../windows/index.js';

//-----------------------------------------------------------------------------
// GameEnd
//
// The scene class of the game end screen.
class GameEnd extends scenes.MenuBase {
    initialize() {
        super.initialize();
    }

    create() {
        super.create();
        this.createCommandWindow();
    }

    stop() {
        super.stop();
        this._commandWindow.close();
    }

    createBackground() {
        super.createBackground();
        this.setBackgroundOpacity(128);
    }

    createCommandWindow() {
        this._commandWindow = new windows.GameEnd();
        this._commandWindow.setHandler('toTitle',  this.commandToTitle.bind(this));
        this._commandWindow.setHandler('cancel',   this.popScene.bind(this));
        this.addWindow(this._commandWindow);
    }

    commandToTitle() {
        this.fadeOutAll();
        managers.SceneManager.goto(scenes.Title);
    }
}

export {GameEnd};
