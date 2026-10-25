import * as windows from './index.js';

//-----------------------------------------------------------------------------
// ShopSell
//
// The window for selecting an item to sell on the shop screen.
class ShopSell extends windows.ItemList {
    initialize(x, y, width, height) {
        super.initialize(x, y, width, height);
    }

    isEnabled(item) {
        return item && item.price > 0;
    }
}

export {ShopSell};
