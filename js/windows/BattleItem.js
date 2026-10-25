import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// BattleItem
//
// The window for selecting an item to use on the battle screen.
class BattleItem extends windows.ItemList {
    initialize(x, y, width, height) {
        super.initialize(x, y, width, height);
        this.hide();
    }

    includes(item) {
        return managers.State.$gameParty.canUse(item);
    }

    show() {
        this.selectLast();
        this.showHelpWindow();
        super.show();
    }

    hide() {
        this.hideHelpWindow();
        super.hide();
    }
}

export {BattleItem};
