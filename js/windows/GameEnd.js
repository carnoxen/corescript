import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// GameEnd
//
// The window for selecting "Go to Title" on the game end screen.
class GameEnd extends windows.Command {
    initialize() {
        super.initialize(0, 0);
        this.updatePlacement();
        this.openness = 0;
        this.open();
    }

    windowWidth() {
        return 240;
    }

    updatePlacement() {
        this.x = (core.Graphics.boxWidth - this.width) / 2;
        this.y = (core.Graphics.boxHeight - this.height) / 2;
    }

    makeCommandList() {
        this.addCommand(managers.TextManager.toTitle, 'toTitle');
        this.addCommand(managers.TextManager.cancel,  'cancel');
    }
}

export {GameEnd};
