import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// BattleEnemy
//
// The window for selecting a target enemy on the battle screen.
class BattleEnemy extends windows.Selectable {
    initialize(x, y) {
        this._enemies = [];
        var width = this.windowWidth();
        var height = this.windowHeight();
        super.initialize(x, y, width, height);
        this.refresh();
        this.hide();
    }

    windowWidth() {
        return core.Graphics.boxWidth - 192;
    }

    windowHeight() {
        return this.fittingHeight(this.numVisibleRows());
    }

    numVisibleRows() {
        return 4;
    }

    maxCols() {
        return 2;
    }

    maxItems() {
        return this._enemies.length;
    }

    enemy() {
        return this._enemies[this.index()];
    }

    enemyIndex() {
        var enemy = this.enemy();
        return enemy ? enemy.index() : -1;
    }

    drawItem(index) {
        this.resetTextColor();
        var name = this._enemies[index].name();
        var rect = this.itemRectForText(index);
        this.drawText(name, rect.x, rect.y, rect.width);
    }

    show() {
        this.refresh();
        this.select(0);
        super.show();
    }

    hide() {
        super.hide();
        managers.State.$gameTroop.select(null);
    }

    refresh() {
        this._enemies = managers.State.$gameTroop.aliveMembers();
        super.refresh();
    }

    select(index) {
        super.select(index);
        managers.State.$gameTroop.select(this.enemy());
    }
}

export {BattleEnemy};
