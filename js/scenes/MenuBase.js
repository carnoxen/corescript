import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as scenes from './index.js';
import * as windows from '../windows/index.js';

//-----------------------------------------------------------------------------
// MenuBase
//
// The superclass of all the menu-type scenes.
class MenuBase extends scenes.Base {
    initialize() {
        super.initialize();
    }

    create() {
        super.create();
        this.createBackground();
        this.updateActor();
        this.createWindowLayer();
    }

    actor() {
        return this._actor;
    }

    updateActor() {
        this._actor = managers.State.$gameParty.menuActor();
    }

    createBackground() {
        this._backgroundSprite = new core.Sprite();
        this._backgroundSprite.bitmap = managers.SceneManager.backgroundBitmap();
        this.addChild(this._backgroundSprite);
    }

    setBackgroundOpacity(opacity) {
        this._backgroundSprite.opacity = opacity;
    }

    createHelpWindow() {
        this._helpWindow = new windows.Help();
        this.addWindow(this._helpWindow);
    }

    nextActor() {
        managers.State.$gameParty.makeMenuActorNext();
        this.updateActor();
        this.onActorChange();
    }

    previousActor() {
        managers.State.$gameParty.makeMenuActorPrevious();
        this.updateActor();
        this.onActorChange();
    }

    onActorChange() {
    }
}

export {MenuBase};
