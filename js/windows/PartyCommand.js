import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// PartyCommand
//
// The window for selecting whether to fight or escape on the battle screen.
class PartyCommand extends windows.Command {
    initialize() {
        var y = core.Graphics.boxHeight - this.windowHeight();
        super.initialize(0, y);
        this.openness = 0;
        this.deactivate();
    }

    windowWidth() {
        return 192;
    }

    numVisibleRows() {
        return 4;
    }

    makeCommandList() {
        this.addCommand(managers.TextManager.fight,  'fight');
        this.addCommand(managers.TextManager.escape, 'escape', managers.BattleManager.canEscape());
    }

    setup() {
        this.clearCommandList();
        this.makeCommandList();
        this.refresh();
        this.select(0);
        this.activate();
        this.open();
    }
}

export {PartyCommand};
