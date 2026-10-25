import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as sprites from '../sprites/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// ShopNumber
//
// The window for inputting quantity of items to buy or sell on the shop
// screen.
class ShopNumber extends windows.Selectable {
    initialize(x, y, height) {
        var width = this.windowWidth();
        super.initialize(x, y, width, height);
        this._item = null;
        this._max = 1;
        this._price = 0;
        this._number = 1;
        this._currencyUnit = managers.TextManager.currencyUnit;
        this.createButtons();
    }

    windowWidth() {
        return 456;
    }

    number() {
        return this._number;
    }

    setup(item, max, price) {
        this._item = item;
        this._max = Math.floor(max);
        this._price = price;
        this._number = 1;
        this.placeButtons();
        this.updateButtonsVisiblity();
        this.refresh();
    }

    setCurrencyUnit(currencyUnit) {
        this._currencyUnit = currencyUnit;
        this.refresh();
    }

    createButtons() {
        var bitmap = managers.ImageManager.loadSystem('ButtonSet');
        var buttonWidth = 48;
        var buttonHeight = 48;
        this._buttons = [];
        for (var i = 0; i < 5; i++) {
            var button = new sprites.Button();
            var x = buttonWidth * i;
            var w = buttonWidth * (i === 4 ? 2 : 1);
            button.bitmap = bitmap;
            button.setColdFrame(x, 0, w, buttonHeight);
            button.setHotFrame(x, buttonHeight, w, buttonHeight);
            button.visible = false;
            this._buttons.push(button);
            this.addChild(button);
        }
        this._buttons[0].setClickHandler(this.onButtonDown2.bind(this));
        this._buttons[1].setClickHandler(this.onButtonDown.bind(this));
        this._buttons[2].setClickHandler(this.onButtonUp.bind(this));
        this._buttons[3].setClickHandler(this.onButtonUp2.bind(this));
        this._buttons[4].setClickHandler(this.onButtonOk.bind(this));
    }

    placeButtons() {
        var numButtons = this._buttons.length;
        var spacing = 16;
        var totalWidth = -spacing;
        for (var i = 0; i < numButtons; i++) {
            totalWidth += this._buttons[i].width + spacing;
        }
        var x = (this.width - totalWidth) / 2;
        for (var j = 0; j < numButtons; j++) {
            var button = this._buttons[j];
            button.x = x;
            button.y = this.buttonY();
            x += button.width + spacing;
        }
    }

    updateButtonsVisiblity() {
        if (core.TouchInput.date > core.Input.date) {
            this.showButtons();
        } else {
            this.hideButtons();
        }
    }

    showButtons() {
        for (var i = 0; i < this._buttons.length; i++) {
            this._buttons[i].visible = true;
        }
    }

    hideButtons() {
        for (var i = 0; i < this._buttons.length; i++) {
            this._buttons[i].visible = false;
        }
    }

    refresh() {
        this.contents.clear();
        this.drawItemName(this._item, 0, this.itemY());
        this.drawMultiplicationSign();
        this.drawNumber();
        this.drawTotalPrice();
    }

    drawMultiplicationSign() {
        var sign = '\u00d7';
        var width = this.textWidth(sign);
        var x = this.cursorX() - width * 2;
        var y = this.itemY();
        this.resetTextColor();
        this.drawText(sign, x, y, width);
    }

    drawNumber() {
        var x = this.cursorX();
        var y = this.itemY();
        var width = this.cursorWidth() - this.textPadding();
        this.resetTextColor();
        this.drawText(this._number, x, y, width, 'right');
    }

    drawTotalPrice() {
        var total = this._price * this._number;
        var width = this.contentsWidth() - this.textPadding();
        this.drawCurrencyValue(total, this._currencyUnit, 0, this.priceY(), width);
    }

    itemY() {
        return Math.round(this.contentsHeight() / 2 - this.lineHeight() * 1.5);
    }

    priceY() {
        return Math.round(this.contentsHeight() / 2 + this.lineHeight() / 2);
    }

    buttonY() {
        return Math.round(this.priceY() + this.lineHeight() * 2.5);
    }

    cursorWidth() {
        var digitWidth = this.textWidth('0');
        return this.maxDigits() * digitWidth + this.textPadding() * 2;
    }

    cursorX() {
        return this.contentsWidth() - this.cursorWidth() - this.textPadding();
    }

    maxDigits() {
        return 2;
    }

    update() {
        super.update();
        this.processNumberChange();
    }

    isOkTriggered() {
        return core.Input.isTriggered('ok');
    }

    playOkSound() {
    }

    processNumberChange() {
        if (this.isOpenAndActive()) {
            if (core.Input.isRepeated('right')) {
                this.changeNumber(1);
            }
            if (core.Input.isRepeated('left')) {
                this.changeNumber(-1);
            }
            if (core.Input.isRepeated('up')) {
                this.changeNumber(10);
            }
            if (core.Input.isRepeated('down')) {
                this.changeNumber(-10);
            }
        }
    }

    changeNumber(amount) {
        var lastNumber = this._number;
        this._number = (this._number + amount).clamp(1, this._max);
        if (this._number !== lastNumber) {
            managers.SoundManager.playCursor();
            this.refresh();
        }
    }

    updateCursor() {
        this.setCursorRect(this.cursorX(), this.itemY(),
                           this.cursorWidth(), this.lineHeight());
    }

    onButtonUp() {
        this.changeNumber(1);
    }

    onButtonUp2() {
        this.changeNumber(10);
    }

    onButtonDown() {
        this.changeNumber(-1);
    }

    onButtonDown2() {
        this.changeNumber(-10);
    }

    onButtonOk() {
        this.processOk();
    }
}

export {ShopNumber};
