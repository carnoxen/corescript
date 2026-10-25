import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// EventItem
//
// The window used for the event command [Select Item].
class EventItem extends windows.ItemList {
    initialize(messageWindow) {
        this._messageWindow = messageWindow;
        var width = core.Graphics.boxWidth;
        var height = this.windowHeight();
        super.initialize(0, 0, width, height);
        this.openness = 0;
        this.deactivate();
        this.setHandler('ok',     this.onOk.bind(this));
        this.setHandler('cancel', this.onCancel.bind(this));
    }

    windowHeight() {
        return this.fittingHeight(this.numVisibleRows());
    }

    numVisibleRows() {
        return 4;
    }

    start() {
        this.refresh();
        this.updatePlacement();
        this.select(0);
        this.open();
        this.activate();
    }

    updatePlacement() {
        if (this._messageWindow.y >= core.Graphics.boxHeight / 2) {
            this.y = 0;
        } else {
            this.y = core.Graphics.boxHeight - this.height;
        }
    }

    includes(item) {
        var itypeId = managers.State.$gameMessage.itemChoiceItypeId();
        return managers.DataManager.isItem(item) && item.itypeId === itypeId;
    }

    isEnabled(item) {
        return true;
    }

    onOk() {
        var item = this.item();
        var itemId = item ? item.id : 0;
        managers.State.$gameVariables.setValue(managers.State.$gameMessage.itemChoiceVariableId(), itemId);
        this._messageWindow.terminateMessage();
        this.close();
    }

    onCancel() {
        managers.State.$gameVariables.setValue(managers.State.$gameMessage.itemChoiceVariableId(), 0);
        this._messageWindow.terminateMessage();
        this.close();
    }
}

export {EventItem};
