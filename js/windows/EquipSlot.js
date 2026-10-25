import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// EquipSlot
//
// The window for selecting an equipment slot on the equipment screen.
class EquipSlot extends windows.Selectable {
    initialize(x, y, width, height) {
        super.initialize(x, y, width, height);
        this._actor = null;
        this.refresh();
    }

    setActor(actor) {
        if (this._actor !== actor) {
            this._actor = actor;
            this.refresh();
        }
    }

    update() {
        super.update();
        if (this._itemWindow) {
            this._itemWindow.setSlotId(this.index());
        }
    }

    maxItems() {
        return this._actor ? this._actor.equipSlots().length : 0;
    }

    item() {
        return this._actor ? this._actor.equips()[this.index()] : null;
    }

    drawItem(index) {
        if (this._actor) {
            var rect = this.itemRectForText(index);
            this.changeTextColor(this.systemColor());
            this.changePaintOpacity(this.isEnabled(index));
            this.drawText(this.slotName(index), rect.x, rect.y, 138, this.lineHeight());
            this.drawItemName(this._actor.equips()[index], rect.x + 138, rect.y);
            this.changePaintOpacity(true);
        }
    }

    slotName(index) {
        var slots = this._actor.equipSlots();
        return this._actor ? managers.State.$dataSystem.equipTypes[slots[index]] : '';
    }

    isEnabled(index) {
        return this._actor ? this._actor.isEquipChangeOk(index) : false;
    }

    isCurrentItemEnabled() {
        return this.isEnabled(this.index());
    }

    setStatusWindow(statusWindow) {
        this._statusWindow = statusWindow;
        this.callUpdateHelp();
    }

    setItemWindow(itemWindow) {
        this._itemWindow = itemWindow;
    }

    updateHelp() {
        super.updateHelp();
        this.setHelpWindowItem(this.item());
        if (this._statusWindow) {
            this._statusWindow.setTempActor(null);
        }
    }
}

export {EquipSlot};
