import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// ItemCategory
//
// The window for selecting a category of items on the item and shop screens.
class ItemCategory extends windows.HorzCommand {
    initialize() {
        super.initialize(0, 0);
    }

    windowWidth() {
        return core.Graphics.boxWidth;
    }

    maxCols() {
        return 4;
    }

    update() {
        super.update();
        if (this._itemWindow) {
            this._itemWindow.setCategory(this.currentSymbol());
        }
    }

    makeCommandList() {
        this.addCommand(managers.TextManager.item,    'item');
        this.addCommand(managers.TextManager.weapon,  'weapon');
        this.addCommand(managers.TextManager.armor,   'armor');
        this.addCommand(managers.TextManager.keyItem, 'keyItem');
    }

    setItemWindow(itemWindow) {
        this._itemWindow = itemWindow;
    }
}

export {ItemCategory};
