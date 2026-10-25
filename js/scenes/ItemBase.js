import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as objects from '../objects/index.js';
import * as scenes from './index.js';
import * as windows from '../windows/index.js';

//-----------------------------------------------------------------------------
// ItemBase
//
// The superclass of scenes.Item and scenes.Skill.
class ItemBase extends scenes.MenuBase {
    initialize() {
        super.initialize();
    }

    create() {
        super.create();
    }

    createActorWindow() {
        this._actorWindow = new windows.MenuActor();
        this._actorWindow.setHandler('ok',     this.onActorOk.bind(this));
        this._actorWindow.setHandler('cancel', this.onActorCancel.bind(this));
        this.addWindow(this._actorWindow);
    }

    item() {
        return this._itemWindow.item();
    }

    user() {
        return null;
    }

    isCursorLeft() {
        return this._itemWindow.index() % 2 === 0;
    }

    showSubWindow(window) {
        window.x = this.isCursorLeft() ? core.Graphics.boxWidth - window.width : 0;
        window.show();
        window.activate();
    }

    hideSubWindow(window) {
        window.hide();
        window.deactivate();
        this.activateItemWindow();
    }

    onActorOk() {
        if (this.canUse()) {
            this.useItem();
        } else {
            managers.SoundManager.playBuzzer();
        }
    }

    onActorCancel() {
        this.hideSubWindow(this._actorWindow);
    }

    action() {
        var action = new objects.Action(this.user());
        action.setItemObject(this.item());
        return action;
    }

    determineItem() {
        var action = this.action();
        if (action.isForFriend()) {
            this.showSubWindow(this._actorWindow);
            this._actorWindow.selectForItem(this.item());
        } else {
            this.useItem();
            this.activateItemWindow();
        }
    }

    useItem() {
        this.playSeForItem();
        this.user().useItem(this.item());
        this.applyItem();
        this.checkCommonEvent();
        this.checkGameover();
        this._actorWindow.refresh();
    }

    activateItemWindow() {
        this._itemWindow.refresh();
        this._itemWindow.activate();
    }

    itemTargetActors() {
        var action = this.action();
        if (!action.isForFriend()) {
            return [];
        } else if (action.isForAll()) {
            return managers.State.$gameParty.members();
        } else {
            return [managers.State.$gameParty.members()[this._actorWindow.index()]];
        }
    }

    canUse() {
        var user = this.user();
        if(user){
            return user.canUse(this.item()) && this.isItemEffectsValid();
        }
        return false;
    }

    isItemEffectsValid() {
        var action = this.action();
        return this.itemTargetActors().some(function(target) {
            return action.testApply(target);
        }, this);
    }

    applyItem() {
        var action = this.action();
        var targets = this.itemTargetActors();
        targets.forEach(function(battler) {
            var repeats = action.numRepeats();
            for (var i = 0; i < repeats; i++) {
                action.apply(battler);
            }
        });
        action.applyGlobal();
    }

    checkCommonEvent() {
        if (managers.State.$gameTemp.isCommonEventReserved()) {
            managers.SceneManager.goto(scenes.Map);
        }
    }
}

export {ItemBase};
