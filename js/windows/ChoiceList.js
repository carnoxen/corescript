import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// ChoiceList
//
// The window used for the event command [Show Choices].
class ChoiceList extends windows.Command {
    initialize(messageWindow) {
        this._messageWindow = messageWindow;
        super.initialize(0, 0);
        this.openness = 0;
        this.deactivate();
        this._background = 0;
    }

    start() {
        this.updatePlacement();
        this.updateBackground();
        this.refresh();
        this.selectDefault();
        this.open();
        this.activate();
    }

    selectDefault() {
        this.select(managers.State.$gameMessage.choiceDefaultType());
    }

    updatePlacement() {
        var positionType = managers.State.$gameMessage.choicePositionType();
        var messageY = this._messageWindow.y;
        this.width = this.windowWidth();
        this.height = this.windowHeight();
        switch (positionType) {
        case 0:
            this.x = 0;
            break;
        case 1:
            this.x = (core.Graphics.boxWidth - this.width) / 2;
            break;
        case 2:
            this.x = core.Graphics.boxWidth - this.width;
            break;
        }
        if (messageY >= core.Graphics.boxHeight / 2) {
            this.y = messageY - this.height;
        } else {
            this.y = messageY + this._messageWindow.height;
        }
    }

    updateBackground() {
        this._background = managers.State.$gameMessage.choiceBackground();
        this.setBackgroundType(this._background);
    }

    windowWidth() {
        var width = this.maxChoiceWidth() + this.padding * 2;
        return Math.min(width, core.Graphics.boxWidth);
    }

    numVisibleRows() {
        var messageY = this._messageWindow.y;
        var messageHeight = this._messageWindow.height;
        var centerY = core.Graphics.boxHeight / 2;
        var choices = managers.State.$gameMessage.choices();
        var numLines = choices.length;
        var maxLines = 8;
        if (messageY < centerY && messageY + messageHeight > centerY) {
            maxLines = 4;
        }
        if (numLines > maxLines) {
            numLines = maxLines;
        }
        return numLines;
    }

    maxChoiceWidth() {
        var maxWidth = 96;
        var choices = managers.State.$gameMessage.choices();
        for (var i = 0; i < choices.length; i++) {
            var choiceWidth = this.textWidthEx(choices[i]) + this.textPadding() * 2;
            if (maxWidth < choiceWidth) {
                maxWidth = choiceWidth;
            }
        }
        return maxWidth;
    }

    textWidthEx(text) {
        return this.drawTextEx(text, 0, this.contents.height);
    }

    contentsHeight() {
        return this.maxItems() * this.itemHeight();
    }

    makeCommandList() {
        var choices = managers.State.$gameMessage.choices();
        for (var i = 0; i < choices.length; i++) {
            this.addCommand(choices[i], 'choice');
        }
    }

    drawItem(index) {
        var rect = this.itemRectForText(index);
        this.drawTextEx(this.commandName(index), rect.x, rect.y);
    }

    isCancelEnabled() {
        return managers.State.$gameMessage.choiceCancelType() !== -1;
    }

    isOkTriggered() {
        return core.Input.isTriggered('ok');
    }

    callOkHandler() {
        managers.State.$gameMessage.onChoice(this.index());
        this._messageWindow.terminateMessage();
        this.close();
    }

    callCancelHandler() {
        managers.State.$gameMessage.onChoice(managers.State.$gameMessage.choiceCancelType());
        this._messageWindow.terminateMessage();
        this.close();
    }
}

export {ChoiceList};
