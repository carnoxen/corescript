import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// MenuStatus
//
// The window for displaying party member status on the menu screen.
class MenuStatus extends windows.Selectable {
    initialize(x, y) {
        var width = this.windowWidth();
        var height = this.windowHeight();
        super.initialize(x, y, width, height);
        this._formationMode = false;
        this._pendingIndex = -1;
        this.refresh();
    }

    windowWidth() {
        return core.Graphics.boxWidth - 240;
    }

    windowHeight() {
        return core.Graphics.boxHeight;
    }

    maxItems() {
        return managers.State.$gameParty.size();
    }

    itemHeight() {
        var clientHeight = this.height - this.padding * 2;
        return Math.floor(clientHeight / this.numVisibleRows());
    }

    numVisibleRows() {
        return 4;
    }

    loadImages() {
        managers.State.$gameParty.members().forEach(function(actor) {
            managers.ImageManager.reserveFace(actor.faceName());
        }, this);
    }

    drawItem(index) {
        this.drawItemBackground(index);
        this.drawItemImage(index);
        this.drawItemStatus(index);
    }

    drawItemBackground(index) {
        if (index === this._pendingIndex) {
            var rect = this.itemRect(index);
            var color = this.pendingColor();
            this.changePaintOpacity(false);
            this.contents.fillRect(rect.x, rect.y, rect.width, rect.height, color);
            this.changePaintOpacity(true);
        }
    }

    drawItemImage(index) {
        var actor = managers.State.$gameParty.members()[index];
        var rect = this.itemRect(index);
        this.changePaintOpacity(actor.isBattleMember());
        this.drawActorFace(actor, rect.x + 1, rect.y + 1, windows.Base._faceWidth, windows.Base._faceHeight);
        this.changePaintOpacity(true);
    }

    drawItemStatus(index) {
        var actor = managers.State.$gameParty.members()[index];
        var rect = this.itemRect(index);
        var x = rect.x + 162;
        var y = rect.y + rect.height / 2 - this.lineHeight() * 1.5;
        var width = rect.width - x - this.textPadding();
        this.drawActorSimpleStatus(actor, x, y, width);
    }

    processOk() {
        super.processOk();
        managers.State.$gameParty.setMenuActor(managers.State.$gameParty.members()[this.index()]);
    }

    isCurrentItemEnabled() {
        if (this._formationMode) {
            var actor = managers.State.$gameParty.members()[this.index()];
            return actor && actor.isFormationChangeOk();
        } else {
            return true;
        }
    }

    selectLast() {
        this.select(managers.State.$gameParty.menuActor().index() || 0);
    }

    formationMode() {
        return this._formationMode;
    }

    setFormationMode(formationMode) {
        this._formationMode = formationMode;
    }

    pendingIndex() {
        return this._pendingIndex;
    }

    setPendingIndex(index) {
        var lastPendingIndex = this._pendingIndex;
        this._pendingIndex = index;
        this.redrawItem(this._pendingIndex);
        this.redrawItem(lastPendingIndex);
    }
}

export {MenuStatus};
