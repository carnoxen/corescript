import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// ShopCommand
//
// The window for selecting buy/sell on the shop screen.
class ShopCommand extends windows.HorzCommand {
    initialize(width, purchaseOnly) {
        this._windowWidth = width;
        this._purchaseOnly = purchaseOnly;
        super.initialize(0, 0);
    }

    windowWidth() {
        return this._windowWidth;
    }

    maxCols() {
        return 3;
    }

    makeCommandList() {
        this.addCommand(managers.TextManager.buy,    'buy');
        this.addCommand(managers.TextManager.sell,   'sell',   !this._purchaseOnly);
        this.addCommand(managers.TextManager.cancel, 'cancel');
    }
}

export {ShopCommand};
