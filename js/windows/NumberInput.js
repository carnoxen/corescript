import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as sprites from '../sprites/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// NumberInput
//
// The window used for the event command [Input Number].
class NumberInput extends windows.Selectable {
    initialize(messageWindow) {
        this._messageWindow = messageWindow;
        super.initialize(0, 0, 0, 0);
        this._number = 0;
        this._maxDigits = 1;
        this.openness = 0;
        this.createButtons();
        this.deactivate();
    }

    start() {
        this._maxDigits = managers.State.$gameMessage.numInputMaxDigits();
        this._number = managers.State.$gameVariables.value(managers.State.$gameMessage.numInputVariableId());
        this._number = this._number.clamp(0, Math.pow(10, this._maxDigits) - 1);
        this.updatePlacement();
        this.placeButtons();
        this.updateButtonsVisiblity();
        this.createContents();
        this.refresh();
        this.open();
        this.activate();
        this.select(0);
    }

    updatePlacement() {
        var messageY = this._messageWindow.y;
        var spacing = 8;
        this.width = this.windowWidth();
        this.height = this.windowHeight();
        this.x = (core.Graphics.boxWidth - this.width) / 2;
        if (messageY >= core.Graphics.boxHeight / 2) {
            this.y = messageY - this.height - spacing;
        } else {
            this.y = messageY + this._messageWindow.height + spacing;
        }
    }

    windowWidth() {
        return this.maxCols() * this.itemWidth() + this.padding * 2;
    }

    windowHeight() {
        return this.fittingHeight(1);
    }

    maxCols() {
        return this._maxDigits;
    }

    maxItems() {
        return this._maxDigits;
    }

    spacing() {
        return 0;
    }

    itemWidth() {
        return 32;
    }

    createButtons() {
        var bitmap = managers.ImageManager.loadSystem('ButtonSet');
        var buttonWidth = 48;
        var buttonHeight = 48;
        this._buttons = [];
        for (var i = 0; i < 3; i++) {
            var button = new sprites.Button();
            var x = buttonWidth * [1, 2, 4][i];
            var w = buttonWidth * (i === 2 ? 2 : 1);
            button.bitmap = bitmap;
            button.setColdFrame(x, 0, w, buttonHeight);
            button.setHotFrame(x, buttonHeight, w, buttonHeight);
            button.visible = false;
            this._buttons.push(button);
            this.addChild(button);
        }
        this._buttons[0].setClickHandler(this.onButtonDown.bind(this));
        this._buttons[1].setClickHandler(this.onButtonUp.bind(this));
        this._buttons[2].setClickHandler(this.onButtonOk.bind(this));
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

    buttonY() {
        var spacing = 8;
        if (this._messageWindow.y >= core.Graphics.boxHeight / 2) {
            return 0 - this._buttons[0].height - spacing;
        } else {
            return this.height + spacing;
        }
    }

    update() {
        super.update();
        this.processDigitChange();
    }

    processDigitChange() {
        if (this.isOpenAndActive()) {
            if (core.Input.isRepeated('up')) {
                this.changeDigit(true);
            } else if (core.Input.isRepeated('down')) {
                this.changeDigit(false);
            }
        }
    }

    changeDigit(up) {
        var index = this.index();
        var place = Math.pow(10, this._maxDigits - 1 - index);
        var n = Math.floor(this._number / place) % 10;
        this._number -= n * place;
        if (up) {
            n = (n + 1) % 10;
        } else {
            n = (n + 9) % 10;
        }
        this._number += n * place;
        this.refresh();
        managers.SoundManager.playCursor();
    }

    isTouchOkEnabled() {
        return false;
    }

    isOkEnabled() {
        return true;
    }

    isCancelEnabled() {
        return false;
    }

    isOkTriggered() {
        return core.Input.isTriggered('ok');
    }

    processOk() {
        managers.SoundManager.playOk();
        managers.State.$gameVariables.setValue(managers.State.$gameMessage.numInputVariableId(), this._number);
        this._messageWindow.terminateMessage();
        this.updateInputData();
        this.deactivate();
        this.close();
    }

    drawItem(index) {
        var rect = this.itemRect(index);
        var align = 'center';
        var s = this._number.padZero(this._maxDigits);
        var c = s.slice(index, index + 1);
        this.resetTextColor();
        this.drawText(c, rect.x, rect.y, rect.width, align);
    }

    onButtonUp() {
        this.changeDigit(true);
    }

    onButtonDown() {
        this.changeDigit(false);
    }

    onButtonOk() {
        this.processOk();
        this.hideButtons();
    }
}

export {NumberInput};
