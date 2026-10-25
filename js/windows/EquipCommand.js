import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// EquipCommand
//
// The window for selecting a command on the equipment screen.
class EquipCommand extends windows.HorzCommand {
    initialize(x, y, width) {
        this._windowWidth = width;
        super.initialize(x, y);
    }

    windowWidth() {
        return this._windowWidth;
    }

    maxCols() {
        return 3;
    }

    makeCommandList() {
        this.addCommand(managers.TextManager.equip2,   'equip');
        this.addCommand(managers.TextManager.optimize, 'optimize');
        this.addCommand(managers.TextManager.clear,    'clear');
    }
}

export {EquipCommand};
