import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as scenes from './index.js';
import * as windows from '../windows/index.js';

//-----------------------------------------------------------------------------
// Shop
//
// The scene class of the shop screen.
class Shop extends scenes.MenuBase {
    initialize() {
        super.initialize();
    }

    prepare(goods, purchaseOnly) {
        this._goods = goods;
        this._purchaseOnly = purchaseOnly;
        this._item = null;
    }

    create() {
        super.create();
        this.createHelpWindow();
        this.createGoldWindow();
        this.createCommandWindow();
        this.createDummyWindow();
        this.createNumberWindow();
        this.createStatusWindow();
        this.createBuyWindow();
        this.createCategoryWindow();
        this.createSellWindow();
    }

    createGoldWindow() {
        this._goldWindow = new windows.Gold(0, this._helpWindow.height);
        this._goldWindow.x = core.Graphics.boxWidth - this._goldWindow.width;
        this.addWindow(this._goldWindow);
    }

    createCommandWindow() {
        this._commandWindow = new windows.ShopCommand(this._goldWindow.x, this._purchaseOnly);
        this._commandWindow.y = this._helpWindow.height;
        this._commandWindow.setHandler('buy',    this.commandBuy.bind(this));
        this._commandWindow.setHandler('sell',   this.commandSell.bind(this));
        this._commandWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._commandWindow);
    }

    createDummyWindow() {
        var wy = this._commandWindow.y + this._commandWindow.height;
        var wh = core.Graphics.boxHeight - wy;
        this._dummyWindow = new windows.Base(0, wy, core.Graphics.boxWidth, wh);
        this.addWindow(this._dummyWindow);
    }

    createNumberWindow() {
        var wy = this._dummyWindow.y;
        var wh = this._dummyWindow.height;
        this._numberWindow = new windows.ShopNumber(0, wy, wh);
        this._numberWindow.hide();
        this._numberWindow.setHandler('ok',     this.onNumberOk.bind(this));
        this._numberWindow.setHandler('cancel', this.onNumberCancel.bind(this));
        this.addWindow(this._numberWindow);
    }

    createStatusWindow() {
        var wx = this._numberWindow.width;
        var wy = this._dummyWindow.y;
        var ww = core.Graphics.boxWidth - wx;
        var wh = this._dummyWindow.height;
        this._statusWindow = new windows.ShopStatus(wx, wy, ww, wh);
        this._statusWindow.hide();
        this.addWindow(this._statusWindow);
    }

    createBuyWindow() {
        var wy = this._dummyWindow.y;
        var wh = this._dummyWindow.height;
        this._buyWindow = new windows.ShopBuy(0, wy, wh, this._goods);
        this._buyWindow.setHelpWindow(this._helpWindow);
        this._buyWindow.setStatusWindow(this._statusWindow);
        this._buyWindow.hide();
        this._buyWindow.setHandler('ok',     this.onBuyOk.bind(this));
        this._buyWindow.setHandler('cancel', this.onBuyCancel.bind(this));
        this.addWindow(this._buyWindow);
    }

    createCategoryWindow() {
        this._categoryWindow = new windows.ItemCategory();
        this._categoryWindow.setHelpWindow(this._helpWindow);
        this._categoryWindow.y = this._dummyWindow.y;
        this._categoryWindow.hide();
        this._categoryWindow.deactivate();
        this._categoryWindow.setHandler('ok',     this.onCategoryOk.bind(this));
        this._categoryWindow.setHandler('cancel', this.onCategoryCancel.bind(this));
        this.addWindow(this._categoryWindow);
    }

    createSellWindow() {
        var wy = this._categoryWindow.y + this._categoryWindow.height;
        var wh = core.Graphics.boxHeight - wy;
        this._sellWindow = new windows.ShopSell(0, wy, core.Graphics.boxWidth, wh);
        this._sellWindow.setHelpWindow(this._helpWindow);
        this._sellWindow.hide();
        this._sellWindow.setHandler('ok',     this.onSellOk.bind(this));
        this._sellWindow.setHandler('cancel', this.onSellCancel.bind(this));
        this._categoryWindow.setItemWindow(this._sellWindow);
        this.addWindow(this._sellWindow);
    }

    activateBuyWindow() {
        this._buyWindow.setMoney(this.money());
        this._buyWindow.show();
        this._buyWindow.activate();
        this._statusWindow.show();
    }

    activateSellWindow() {
        this._categoryWindow.show();
        this._sellWindow.refresh();
        this._sellWindow.show();
        this._sellWindow.activate();
        this._statusWindow.hide();
    }

    commandBuy() {
        this._dummyWindow.hide();
        this.activateBuyWindow();
    }

    commandSell() {
        this._dummyWindow.hide();
        this._categoryWindow.show();
        this._categoryWindow.activate();
        this._sellWindow.show();
        this._sellWindow.deselect();
        this._sellWindow.refresh();
    }

    onBuyOk() {
        this._item = this._buyWindow.item();
        this._buyWindow.hide();
        this._numberWindow.setup(this._item, this.maxBuy(), this.buyingPrice());
        this._numberWindow.setCurrencyUnit(this.currencyUnit());
        this._numberWindow.show();
        this._numberWindow.activate();
    }

    onBuyCancel() {
        this._commandWindow.activate();
        this._dummyWindow.show();
        this._buyWindow.hide();
        this._statusWindow.hide();
        this._statusWindow.setItem(null);
        this._helpWindow.clear();
    }

    onCategoryOk() {
        this.activateSellWindow();
        this._sellWindow.select(0);
    }

    onCategoryCancel() {
        this._commandWindow.activate();
        this._dummyWindow.show();
        this._categoryWindow.hide();
        this._sellWindow.hide();
    }

    onSellOk() {
        this._item = this._sellWindow.item();
        this._categoryWindow.hide();
        this._sellWindow.hide();
        this._numberWindow.setup(this._item, this.maxSell(), this.sellingPrice());
        this._numberWindow.setCurrencyUnit(this.currencyUnit());
        this._numberWindow.show();
        this._numberWindow.activate();
        this._statusWindow.setItem(this._item);
        this._statusWindow.show();
    }

    onSellCancel() {
        this._sellWindow.deselect();
        this._categoryWindow.activate();
        this._statusWindow.setItem(null);
        this._helpWindow.clear();
    }

    onNumberOk() {
        managers.SoundManager.playShop();
        switch (this._commandWindow.currentSymbol()) {
        case 'buy':
            this.doBuy(this._numberWindow.number());
            break;
        case 'sell':
            this.doSell(this._numberWindow.number());
            break;
        }
        this.endNumberInput();
        this._goldWindow.refresh();
        this._statusWindow.refresh();
    }

    onNumberCancel() {
        managers.SoundManager.playCancel();
        this.endNumberInput();
    }

    doBuy(number) {
        managers.State.$gameParty.loseGold(number * this.buyingPrice());
        managers.State.$gameParty.gainItem(this._item, number);
    }

    doSell(number) {
        managers.State.$gameParty.gainGold(number * this.sellingPrice());
        managers.State.$gameParty.loseItem(this._item, number);
    }

    endNumberInput() {
        this._numberWindow.hide();
        switch (this._commandWindow.currentSymbol()) {
        case 'buy':
            this.activateBuyWindow();
            break;
        case 'sell':
            this.activateSellWindow();
            break;
        }
    }

    maxBuy() {
        var max = managers.State.$gameParty.maxItems(this._item) - managers.State.$gameParty.numItems(this._item);
        var price = this.buyingPrice();
        if (price > 0) {
            return Math.min(max, Math.floor(this.money() / price));
        } else {
            return max;
        }
    }

    maxSell() {
        return managers.State.$gameParty.numItems(this._item);
    }

    money() {
        return this._goldWindow.value();
    }

    currencyUnit() {
        return this._goldWindow.currencyUnit();
    }

    buyingPrice() {
        return this._buyWindow.price(this._item);
    }

    sellingPrice() {
        return Math.floor(this._item.price / 2);
    }
}

export {Shop};
