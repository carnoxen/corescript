import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// SavefileList
//
// The window for selecting a save file on the save and load screens.
class SavefileList extends windows.Selectable {
    initialize(x, y, width, height) {
        super.initialize(x, y, width, height);
        this.activate();
        this._mode = null;
    }

    setMode(mode) {
        this._mode = mode;
    }

    maxItems() {
        return managers.DataManager.maxSavefiles();
    }

    maxVisibleItems() {
        return 5;
    }

    itemHeight() {
        var innerHeight = this.height - this.padding * 2;
        return Math.floor(innerHeight / this.maxVisibleItems());
    }

    drawItem(index) {
        var id = index + 1;
        var valid = managers.DataManager.isThisGameFile(id);
        var info = managers.DataManager.loadSavefileInfo(id);
        var rect = this.itemRectForText(index);
        this.resetTextColor();
        if (this._mode === 'load') {
            this.changePaintOpacity(valid);
        }
        this.drawFileId(id, rect.x, rect.y);
        if (info) {
            this.changePaintOpacity(valid);
            this.drawContents(info, rect, valid);
            this.changePaintOpacity(true);
        }
    }

    drawFileId(id, x, y) {
        if (managers.DataManager.isAutoSaveFileId(id)) {
            if (this._mode === 'save') {
                this.changePaintOpacity(false);
            }
            this.drawText(managers.TextManager.file + ' ' + id + '(Auto)', x, y, 180);
        } else {
            this.drawText(managers.TextManager.file + ' ' + id, x, y, 180);
        }
    }

    drawContents(info, rect, valid) {
        var bottom = rect.y + rect.height;
        if (rect.width >= 420) {
            this.drawGameTitle(info, rect.x + 192, rect.y, rect.width - 192);
            if (valid) {
                this.drawPartyCharacters(info, rect.x + 220, bottom - 4);
            }
        }
        var lineHeight = this.lineHeight();
        var y2 = bottom - lineHeight;
        if (y2 >= lineHeight) {
            this.drawPlaytime(info, rect.x, y2, rect.width);
        }
    }

    drawGameTitle(info, x, y, width) {
        if (info.title) {
            this.drawText(info.title, x, y, width);
        }
    }

    drawPartyCharacters(info, x, y) {
        if (info.characters) {
            for (var i = 0; i < info.characters.length; i++) {
                var data = info.characters[i];
                this.drawCharacter(data[0], data[1], x + i * 48, y);
            }
        }
    }

    drawPlaytime(info, x, y, width) {
        if (info.playtime) {
            this.drawText(info.playtime, x, y, width, 'right');
        }
    }

    playOkSound() {
    }
}

export {SavefileList};
