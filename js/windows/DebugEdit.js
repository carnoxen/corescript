import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// DebugEdit
//
// The window for displaying switches and variables on the debug screen.
class DebugEdit extends windows.Selectable {
    initialize(x, y, width) {
        var height = this.fittingHeight(10);
        super.initialize(x, y, width, height);
        this._mode = 'switch';
        this._topId = 1;
        this.refresh();
    }

    maxItems() {
        return 10;
    }

    refresh() {
        this.contents.clear();
        this.drawAllItems();
    }

    drawItem(index) {
        var dataId = this._topId + index;
        var idText = dataId.padZero(4) + ':';
        var idWidth = this.textWidth(idText);
        var statusWidth = this.textWidth('-00000000');
        var name = this.itemName(dataId);
        var status = this.itemStatus(dataId);
        var rect = this.itemRectForText(index);
        this.resetTextColor();
        this.drawText(idText, rect.x, rect.y, rect.width);
        rect.x += idWidth;
        rect.width -= idWidth + statusWidth;
        this.drawText(name, rect.x, rect.y, rect.width);
        this.drawText(status, rect.x + rect.width, rect.y, statusWidth, 'right');
    }

    itemName(dataId) {
        if (this._mode === 'switch') {
            return managers.State.$dataSystem.switches[dataId];
        } else {
            return managers.State.$dataSystem.variables[dataId];
        }
    }

    itemStatus(dataId) {
        if (this._mode === 'switch') {
            return managers.State.$gameSwitches.value(dataId) ? '[ON]' : '[OFF]';
        } else {
            return String(managers.State.$gameVariables.value(dataId));
        }
    }

    setMode(mode) {
        if (this._mode !== mode) {
            this._mode = mode;
            this.refresh();
        }
    }

    setTopId(id) {
        if (this._topId !== id) {
            this._topId = id;
            this.refresh();
        }
    }

    currentId() {
        return this._topId + this.index();
    }

    update() {
        super.update();
        if (this.active) {
            if (this._mode === 'switch') {
                this.updateSwitch();
            } else {
                this.updateVariable();
            }
        }
    }

    updateSwitch() {
        if (core.Input.isRepeated('ok')) {
            var switchId = this.currentId();
            managers.SoundManager.playCursor();
            managers.State.$gameSwitches.setValue(switchId, !managers.State.$gameSwitches.value(switchId));
            this.redrawCurrentItem();
        }
    }

    updateVariable() {
        var variableId = this.currentId();
        var value = managers.State.$gameVariables.value(variableId);
        if (typeof value === 'number') {
            if (core.Input.isRepeated('right')) {
                value++;
            }
            if (core.Input.isRepeated('left')) {
                value--;
            }
            if (core.Input.isRepeated('pagedown')) {
                value += 10;
            }
            if (core.Input.isRepeated('pageup')) {
                value -= 10;
            }
            if (managers.State.$gameVariables.value(variableId) !== value) {
                managers.State.$gameVariables.setValue(variableId, value);
                managers.SoundManager.playCursor();
                this.redrawCurrentItem();
            }
        }
    }
}

export {DebugEdit};
