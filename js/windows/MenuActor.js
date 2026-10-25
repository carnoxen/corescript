import * as managers from '../managers/index.js';
import * as objects from '../objects/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// MenuActor
//
// The window for selecting a target actor on the item and skill screens.
class MenuActor extends windows.MenuStatus {
    initialize() {
        super.initialize(0, 0);
        this.hide();
    }

    processOk() {
        if (!this.cursorAll()) {
            managers.State.$gameParty.setTargetActor(managers.State.$gameParty.members()[this.index()]);
        }
        this.callOkHandler();
    }

    selectLast() {
        this.select(managers.State.$gameParty.targetActor().index() || 0);
    }

    selectForItem(item) {
        var actor = managers.State.$gameParty.menuActor();
        var action = new objects.Action(actor);
        action.setItemObject(item);
        this.setCursorFixed(false);
        this.setCursorAll(false);
        if (action.isForUser()) {
            if (managers.DataManager.isSkill(item)) {
                this.setCursorFixed(true);
                this.select(actor.index());
            } else {
                this.selectLast();
            }
        } else if (action.isForAll()) {
            this.setCursorAll(true);
            this.select(0);
        } else {
            this.selectLast();
        }
    }
}

export {MenuActor};
