import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// DebugRange
//
// The window for selecting a block of switches/variables on the debug screen.
class DebugRange extends windows.Selectable {
    static lastTopRow = 0;

    static lastIndex = 0;

    initialize(x, y) {
        this._maxSwitches = Math.ceil((managers.State.$dataSystem.switches.length - 1) / 10);
        this._maxVariables = Math.ceil((managers.State.$dataSystem.variables.length - 1) / 10);
        var width = this.windowWidth();
        var height = this.windowHeight();
        super.initialize(x, y, width, height);
        this.refresh();
        this.setTopRow(DebugRange.lastTopRow);
        this.select(DebugRange.lastIndex);
        this.activate();
    }

    windowWidth() {
        return 246;
    }

    windowHeight() {
        return core.Graphics.boxHeight;
    }

    maxItems() {
        return this._maxSwitches + this._maxVariables;
    }

    update() {
        super.update();
        if (this._editWindow) {
            this._editWindow.setMode(this.mode());
            this._editWindow.setTopId(this.topId());
        }
    }

    mode() {
        return this.index() < this._maxSwitches ? 'switch' : 'variable';
    }

    topId() {
        var index = this.index();
        if (index < this._maxSwitches) {
            return index * 10 + 1;
        } else {
            return (index - this._maxSwitches) * 10 + 1;
        }
    }

    refresh() {
        this.createContents();
        this.drawAllItems();
    }

    drawItem(index) {
        var rect = this.itemRectForText(index);
        var start;
        var text;
        if (index < this._maxSwitches) {
            start = index * 10 + 1;
            text = 'S';
        } else {
            start = (index - this._maxSwitches) * 10 + 1;
            text = 'V';
        }
        var end = start + 9;
        text += ' [' + start.padZero(4) + '-' + end.padZero(4) + ']';
        this.drawText(text, rect.x, rect.y, rect.width);
    }

    isCancelTriggered() {
        return (windows.Selectable.prototype.isCancelTriggered() ||
                core.Input.isTriggered('debug'));
    }

    processCancel() {
        super.processCancel();
        DebugRange.lastTopRow = this.topRow();
        DebugRange.lastIndex = this.index();
    }

    setEditWindow(editWindow) {
        this._editWindow = editWindow;
    }
}

export {DebugRange};
