import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// TitleCommand
//
// The window for selecting New Game/Continue on the title screen.
class TitleCommand extends windows.Command {
    initialize() {
        super.initialize(0, 0);
        this.updatePlacement();
        this.openness = 0;
        this.selectLast();
    }

    static _lastCommandSymbol = null;

    static initCommandPosition() {
        this._lastCommandSymbol = null;
    }

    windowWidth() {
        return 240;
    }

    updatePlacement() {
        this.x = (core.Graphics.boxWidth - this.width) / 2;
        this.y = core.Graphics.boxHeight - this.height - 96;
    }

    makeCommandList() {
        this.addCommand(managers.TextManager.newGame,   'newGame');
        this.addCommand(managers.TextManager.continue_, 'continue', this.isContinueEnabled());
        this.addCommand(managers.TextManager.options,   'options');
    }

    isContinueEnabled() {
        return managers.DataManager.isAnySavefileExists();
    }

    processOk() {
        TitleCommand._lastCommandSymbol = this.currentSymbol();
        super.processOk();
    }

    selectLast() {
        if (TitleCommand._lastCommandSymbol) {
            this.selectSymbol(TitleCommand._lastCommandSymbol);
        } else if (this.isContinueEnabled()) {
            this.selectSymbol('continue');
        }
    }
}

export {TitleCommand};
