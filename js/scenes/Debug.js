import * as core from '../core/index.js';
import * as scenes from './index.js';
import * as windows from '../windows/index.js';

//-----------------------------------------------------------------------------
// Debug
//
// The scene class of the debug screen.
class Debug extends scenes.MenuBase {
    initialize() {
        super.initialize();
    }

    create() {
        super.create();
        this.createRangeWindow();
        this.createEditWindow();
        this.createDebugHelpWindow();
    }

    createRangeWindow() {
        this._rangeWindow = new windows.DebugRange(0, 0);
        this._rangeWindow.setHandler('ok',     this.onRangeOk.bind(this));
        this._rangeWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._rangeWindow);
    }

    createEditWindow() {
        var wx = this._rangeWindow.width;
        var ww = core.Graphics.boxWidth - wx;
        this._editWindow = new windows.DebugEdit(wx, 0, ww);
        this._editWindow.setHandler('cancel', this.onEditCancel.bind(this));
        this._rangeWindow.setEditWindow(this._editWindow);
        this.addWindow(this._editWindow);
    }

    createDebugHelpWindow() {
        var wx = this._editWindow.x;
        var wy = this._editWindow.height;
        var ww = this._editWindow.width;
        var wh = core.Graphics.boxHeight - wy;
        this._debugHelpWindow = new windows.Base(wx, wy, ww, wh);
        this.addWindow(this._debugHelpWindow);
    }

    onRangeOk() {
        this._editWindow.activate();
        this._editWindow.select(0);
        this.refreshHelpWindow();
    }

    onEditCancel() {
        this._rangeWindow.activate();
        this._editWindow.deselect();
        this.refreshHelpWindow();
    }

    refreshHelpWindow() {
        this._debugHelpWindow.contents.clear();
        if (this._editWindow.active) {
            this._debugHelpWindow.drawTextEx(this.helpText(), 4, 0);
        }
    }

    helpText() {
        if (this._rangeWindow.mode() === 'switch') {
            return 'Enter : ON / OFF';
        } else {
            return ('Left     :  -1\n' +
                    'Right    :  +1\n' +
                    'Pageup   : -10\n' +
                    'Pagedown : +10');
        }
    }
}

export {Debug};
