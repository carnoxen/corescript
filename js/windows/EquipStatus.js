import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// EquipStatus
//
// The window for displaying parameter changes on the equipment screen.
class EquipStatus extends windows.Base {
    initialize(x, y) {
        var width = this.windowWidth();
        var height = this.windowHeight();
        super.initialize(x, y, width, height);
        this._actor = null;
        this._tempActor = null;
        this.refresh();
    }

    windowWidth() {
        return 312;
    }

    windowHeight() {
        return this.fittingHeight(this.numVisibleRows());
    }

    numVisibleRows() {
        return 7;
    }

    setActor(actor) {
        if (this._actor !== actor) {
            this._actor = actor;
            this.refresh();
        }
    }

    refresh() {
        this.contents.clear();
        if (this._actor) {
            this.drawActorName(this._actor, this.textPadding(), 0);
            for (var i = 0; i < 6; i++) {
                this.drawItem(0, this.lineHeight() * (1 + i), 2 + i);
            }
        }
    }

    setTempActor(tempActor) {
        if (this._tempActor !== tempActor) {
            this._tempActor = tempActor;
            this.refresh();
        }
    }

    drawItem(x, y, paramId) {
        this.drawParamName(x + this.textPadding(), y, paramId);
        if (this._actor) {
            this.drawCurrentParam(x + 140, y, paramId);
        }
        this.drawRightArrow(x + 188, y);
        if (this._tempActor) {
            this.drawNewParam(x + 222, y, paramId);
        }
    }

    drawParamName(x, y, paramId) {
        this.changeTextColor(this.systemColor());
        this.drawText(managers.TextManager.param(paramId), x, y, 120);
    }

    drawCurrentParam(x, y, paramId) {
        this.resetTextColor();
        this.drawText(this._actor.param(paramId), x, y, 48, 'right');
    }

    drawRightArrow(x, y) {
        this.changeTextColor(this.systemColor());
        this.drawText('\u2192', x, y, 32, 'center');
    }

    drawNewParam(x, y, paramId) {
        var newValue = this._tempActor.param(paramId);
        var diffvalue = newValue - this._actor.param(paramId);
        this.changeTextColor(this.paramchangeTextColor(diffvalue));
        this.drawText(newValue, x, y, 48, 'right');
    }
}

export {EquipStatus};
