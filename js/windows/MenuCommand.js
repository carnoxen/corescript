import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// MenuCommand
//
// The window for selecting a command on the menu screen.
class MenuCommand extends windows.Command {
    initialize(x, y) {
        super.initialize(x, y);
        this.selectLast();
    }

    static _lastCommandSymbol = null;

    static initCommandPosition() {
        this._lastCommandSymbol = null;
    }

    windowWidth() {
        return 240;
    }

    numVisibleRows() {
        return this.maxItems();
    }

    makeCommandList() {
        this.addMainCommands();
        this.addFormationCommand();
        this.addOriginalCommands();
        this.addOptionsCommand();
        this.addSaveCommand();
        this.addGameEndCommand();
    }

    addMainCommands() {
        var enabled = this.areMainCommandsEnabled();
        if (this.needsCommand('item')) {
            this.addCommand(managers.TextManager.item, 'item', enabled);
        }
        if (this.needsCommand('skill')) {
            this.addCommand(managers.TextManager.skill, 'skill', enabled);
        }
        if (this.needsCommand('equip')) {
            this.addCommand(managers.TextManager.equip, 'equip', enabled);
        }
        if (this.needsCommand('status')) {
            this.addCommand(managers.TextManager.status, 'status', enabled);
        }
    }

    addFormationCommand() {
        if (this.needsCommand('formation')) {
            var enabled = this.isFormationEnabled();
            this.addCommand(managers.TextManager.formation, 'formation', enabled);
        }
    }

    addOriginalCommands() {
    }

    addOptionsCommand() {
        if (this.needsCommand('options')) {
            var enabled = this.isOptionsEnabled();
            this.addCommand(managers.TextManager.options, 'options', enabled);
        }
    }

    addSaveCommand() {
        if (this.needsCommand('save')) {
            var enabled = this.isSaveEnabled();
            this.addCommand(managers.TextManager.save, 'save', enabled);
        }
    }

    addGameEndCommand() {
        var enabled = this.isGameEndEnabled();
        this.addCommand(managers.TextManager.gameEnd, 'gameEnd', enabled);
    }

    needsCommand(name) {
        var flags = managers.State.$dataSystem.menuCommands;
        if (flags) {
            switch (name) {
            case 'item':
                return flags[0];
            case 'skill':
                return flags[1];
            case 'equip':
                return flags[2];
            case 'status':
                return flags[3];
            case 'formation':
                return flags[4];
            case 'save':
                return flags[5];
            }
        }
        return true;
    }

    areMainCommandsEnabled() {
        return managers.State.$gameParty.exists();
    }

    isFormationEnabled() {
        return managers.State.$gameParty.size() >= 2 && managers.State.$gameSystem.isFormationEnabled();
    }

    isOptionsEnabled() {
        return true;
    }

    isSaveEnabled() {
        return !managers.DataManager.isEventTest() && managers.State.$gameSystem.isSaveEnabled();
    }

    isGameEndEnabled() {
        return true;
    }

    processOk() {
        MenuCommand._lastCommandSymbol = this.currentSymbol();
        super.processOk();
    }

    selectLast() {
        this.selectSymbol(MenuCommand._lastCommandSymbol);
    }
}

export {MenuCommand};
