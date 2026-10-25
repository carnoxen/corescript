import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as scenes from './index.js';
import * as windows from '../windows/index.js';

//-----------------------------------------------------------------------------
// Item
//
// The scene class of the item screen.
class Item extends scenes.ItemBase {
    initialize() {
        super.initialize();
    }

    create() {
        super.create();
        this.createHelpWindow();
        this.createCategoryWindow();
        this.createItemWindow();
        this.createActorWindow();
    }

    createCategoryWindow() {
        this._categoryWindow = new windows.ItemCategory();
        this._categoryWindow.setHelpWindow(this._helpWindow);
        this._categoryWindow.y = this._helpWindow.height;
        this._categoryWindow.setHandler('ok',     this.onCategoryOk.bind(this));
        this._categoryWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._categoryWindow);
    }

    createItemWindow() {
        var wy = this._categoryWindow.y + this._categoryWindow.height;
        var wh = core.Graphics.boxHeight - wy;
        this._itemWindow = new windows.ItemList(0, wy, core.Graphics.boxWidth, wh);
        this._itemWindow.setHelpWindow(this._helpWindow);
        this._itemWindow.setHandler('ok',     this.onItemOk.bind(this));
        this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
        this.addWindow(this._itemWindow);
        this._categoryWindow.setItemWindow(this._itemWindow);
    }

    user() {
        var members = managers.State.$gameParty.movableMembers();
        var bestActor = members[0];
        var bestPha = 0;
        for (var i = 0; i < members.length; i++) {
            if (members[i].pha > bestPha) {
                bestPha = members[i].pha;
                bestActor = members[i];
            }
        }
        return bestActor;
    }

    onCategoryOk() {
        this._itemWindow.activate();
        this._itemWindow.selectLast();
    }

    onItemOk() {
        managers.State.$gameParty.setLastItem(this.item());
        this.determineItem();
    }

    onItemCancel() {
        this._itemWindow.deselect();
        this._categoryWindow.activate();
    }

    playSeForItem() {
        managers.SoundManager.playUseItem();
    }

    useItem() {
        super.useItem();
        this._itemWindow.redrawCurrentItem();
    }
}

export {Item};
