import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as scenes from './index.js';
import * as windows from '../windows/index.js';

//-----------------------------------------------------------------------------
// File
//
// The superclass of scenes.Save and scenes.Load.
class File extends scenes.MenuBase {
    initialize() {
        super.initialize();
    }

    create() {
        super.create();
        managers.DataManager.loadAllSavefileImages();
        this.createHelpWindow();
        this.createListWindow();
    }

    start() {
        super.start();
        this._listWindow.refresh();
    }

    savefileId() {
        return this._listWindow.index() + 1;
    }

    createHelpWindow() {
        this._helpWindow = new windows.Help(1);
        this._helpWindow.setText(this.helpWindowText());
        this.addWindow(this._helpWindow);
    }

    createListWindow() {
        var x = 0;
        var y = this._helpWindow.height;
        var width = core.Graphics.boxWidth;
        var height = core.Graphics.boxHeight - y;
        this._listWindow = new windows.SavefileList(x, y, width, height);
        this._listWindow.setHandler('ok',     this.onSavefileOk.bind(this));
        this._listWindow.setHandler('cancel', this.popScene.bind(this));
        this._listWindow.select(this.firstSavefileIndex());
        this._listWindow.setTopRow(this.firstSavefileIndex() - 2);
        this._listWindow.setMode(this.mode());
        this._listWindow.refresh();
        this.addWindow(this._listWindow);
    }

    mode() {
        return null;
    }

    activateListWindow() {
        this._listWindow.activate();
    }

    helpWindowText() {
        return '';
    }

    firstSavefileIndex() {
        return 0;
    }

    onSavefileOk() {
    }
}

export {File};
