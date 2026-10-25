import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// ShopBuy
//
// The window for selecting an item to buy on the shop screen.
class ShopBuy extends windows.Selectable {
    initialize(x, y, height, shopGoods) {
        var width = this.windowWidth();
        super.initialize(x, y, width, height);
        this._shopGoods = shopGoods;
        this._money = 0;
        this.refresh();
        this.select(0);
    }

    windowWidth() {
        return 456;
    }

    maxItems() {
        return this._data ? this._data.length : 1;
    }

    item() {
        return this._data[this.index()];
    }

    setMoney(money) {
        this._money = money;
        this.refresh();
    }

    isCurrentItemEnabled() {
        return this.isEnabled(this._data[this.index()]);
    }

    price(item) {
        return this._price[this._data.indexOf(item)] || 0;
    }

    isEnabled(item) {
        return (item && this.price(item) <= this._money &&
                !managers.State.$gameParty.hasMaxItems(item));
    }

    refresh() {
        this.makeItemList();
        this.createContents();
        this.drawAllItems();
    }

    makeItemList() {
        this._data = [];
        this._price = [];
        this._shopGoods.forEach(function(goods) {
            var item = null;
            switch (goods[0]) {
            case 0:
                item = managers.State.$dataItems[goods[1]];
                break;
            case 1:
                item = managers.State.$dataWeapons[goods[1]];
                break;
            case 2:
                item = managers.State.$dataArmors[goods[1]];
                break;
            }
            if (item) {
                this._data.push(item);
                this._price.push(goods[2] === 0 ? item.price : goods[3]);
            }
        }, this);
    }

    drawItem(index) {
        var item = this._data[index];
        var rect = this.itemRect(index);
        var priceWidth = 96;
        rect.width -= this.textPadding();
        this.changePaintOpacity(this.isEnabled(item));
        this.drawItemName(item, rect.x, rect.y, rect.width - priceWidth);
        this.drawText(this.price(item), rect.x + rect.width - priceWidth,
                      rect.y, priceWidth, 'right');
        this.changePaintOpacity(true);
    }

    setStatusWindow(statusWindow) {
        this._statusWindow = statusWindow;
        this.callUpdateHelp();
    }

    updateHelp() {
        this.setHelpWindowItem(this.item());
        if (this._statusWindow) {
            this._statusWindow.setItem(this.item());
        }
    }
}

export {ShopBuy};
