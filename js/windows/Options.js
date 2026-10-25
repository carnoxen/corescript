import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// Options
//
// The window for changing various settings on the options screen.
class Options extends windows.Command {
    initialize() {
        super.initialize(0, 0);
        this.updatePlacement();
    }

    windowWidth() {
        return 400;
    }

    windowHeight() {
        return this.fittingHeight(Math.min(this.numVisibleRows(), 12));
    }

    updatePlacement() {
        this.x = (core.Graphics.boxWidth - this.width) / 2;
        this.y = (core.Graphics.boxHeight - this.height) / 2;
    }

    makeCommandList() {
        this.addGeneralOptions();
        this.addVolumeOptions();
    }

    addGeneralOptions() {
        this.addCommand(managers.TextManager.alwaysDash, 'alwaysDash');
        this.addCommand(managers.TextManager.commandRemember, 'commandRemember');
    }

    addVolumeOptions() {
        this.addCommand(managers.TextManager.bgmVolume, 'bgmVolume');
        this.addCommand(managers.TextManager.bgsVolume, 'bgsVolume');
        this.addCommand(managers.TextManager.meVolume, 'meVolume');
        this.addCommand(managers.TextManager.seVolume, 'seVolume');
    }

    drawItem(index) {
        var rect = this.itemRectForText(index);
        var statusWidth = this.statusWidth();
        var titleWidth = rect.width - statusWidth;
        this.resetTextColor();
        this.changePaintOpacity(this.isCommandEnabled(index));
        this.drawText(this.commandName(index), rect.x, rect.y, titleWidth, 'left');
        this.drawText(this.statusText(index), rect.x+titleWidth, rect.y, statusWidth, 'right');
    }

    statusWidth() {
        return 120;
    }

    statusText(index) {
        var symbol = this.commandSymbol(index);
        var value = this.getConfigValue(symbol);
        if (this.isVolumeSymbol(symbol)) {
            return this.volumeStatusText(value);
        } else {
            return this.booleanStatusText(value);
        }
    }

    isVolumeSymbol(symbol) {
        return symbol.contains('Volume');
    }

    booleanStatusText(value) {
        return value ? 'ON' : 'OFF';
    }

    volumeStatusText(value) {
        return value + '%';
    }

    processOk() {
        var index = this.index();
        var symbol = this.commandSymbol(index);
        var value = this.getConfigValue(symbol);
        if (this.isVolumeSymbol(symbol)) {
            value += this.volumeOffset();
            if (value > 100) {
                value = 0;
            }
            value = value.clamp(0, 100);
            this.changeValue(symbol, value);
        } else {
            this.changeValue(symbol, !value);
        }
    }

    cursorRight(wrap) {
        var index = this.index();
        var symbol = this.commandSymbol(index);
        var value = this.getConfigValue(symbol);
        if (this.isVolumeSymbol(symbol)) {
            value += this.volumeOffset();
            value = value.clamp(0, 100);
            this.changeValue(symbol, value);
        } else {
            this.changeValue(symbol, true);
        }
    }

    cursorLeft(wrap) {
        var index = this.index();
        var symbol = this.commandSymbol(index);
        var value = this.getConfigValue(symbol);
        if (this.isVolumeSymbol(symbol)) {
            value -= this.volumeOffset();
            value = value.clamp(0, 100);
            this.changeValue(symbol, value);
        } else {
            this.changeValue(symbol, false);
        }
    }

    volumeOffset() {
        return 20;
    }

    changeValue(symbol, value) {
        var lastValue = this.getConfigValue(symbol);
        if (lastValue !== value) {
            this.setConfigValue(symbol, value);
            this.redrawItem(this.findSymbol(symbol));
            managers.SoundManager.playCursor();
        }
    }

    getConfigValue(symbol) {
        return managers.ConfigManager[symbol];
    }

    setConfigValue(symbol, volume) {
        managers.ConfigManager[symbol] = volume;
    }
}

export {Options};
