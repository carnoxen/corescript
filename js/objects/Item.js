import * as managers from '../managers/index.js';

//-----------------------------------------------------------------------------
// Item
//
// The game object class for handling skills, items, weapons, and armor. It is
// required because save data should not include the database object itself.
class Item {
    constructor(...args) { this.initialize(...args); }

    initialize(item) {
        this._dataClass = '';
        this._itemId = 0;
        if (item) {
            this.setObject(item);
        }
    }

    isSkill() {
        return this._dataClass === 'skill';
    }

    isItem() {
        return this._dataClass === 'item';
    }

    isUsableItem() {
        return this.isSkill() || this.isItem();
    }

    isWeapon() {
        return this._dataClass === 'weapon';
    }

    isArmor() {
        return this._dataClass === 'armor';
    }

    isEquipItem() {
        return this.isWeapon() || this.isArmor();
    }

    isNull() {
        return this._dataClass === '';
    }

    itemId() {
        return this._itemId;
    }

    object() {
        if (this.isSkill()) {
            return managers.State.$dataSkills[this._itemId];
        } else if (this.isItem()) {
            return managers.State.$dataItems[this._itemId];
        } else if (this.isWeapon()) {
            return managers.State.$dataWeapons[this._itemId];
        } else if (this.isArmor()) {
            return managers.State.$dataArmors[this._itemId];
        } else {
            return null;
        }
    }

    setObject(item) {
        if (managers.DataManager.isSkill(item)) {
            this._dataClass = 'skill';
        } else if (managers.DataManager.isItem(item)) {
            this._dataClass = 'item';
        } else if (managers.DataManager.isWeapon(item)) {
            this._dataClass = 'weapon';
        } else if (managers.DataManager.isArmor(item)) {
            this._dataClass = 'armor';
        } else {
            this._dataClass = '';
        }
        this._itemId = item ? item.id : 0;
    }

    setEquip(isWeapon, itemId) {
        this._dataClass = isWeapon ? 'weapon' : 'armor';
        this._itemId = itemId;
    }
}

export {Item};
