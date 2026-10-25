import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// MapName
//
// The window for displaying the map name on the map screen.
class MapName extends windows.Base {
    initialize() {
        var wight = this.windowWidth();
        var height = this.windowHeight();
        super.initialize(0, 0, wight, height);
        this.opacity = 0;
        this.contentsOpacity = 0;
        this._showCount = 0;
        this.refresh();
    }

    windowWidth() {
        return 360;
    }

    windowHeight() {
        return this.fittingHeight(1);
    }

    update() {
        super.update();
        if (this._showCount > 0 && managers.State.$gameMap.isNameDisplayEnabled()) {
            this.updateFadeIn();
            this._showCount--;
        } else {
            this.updateFadeOut();
        }
    }

    updateFadeIn() {
        this.contentsOpacity += 16;
    }

    updateFadeOut() {
        this.contentsOpacity -= 16;
    }

    open() {
        this.refresh();
        this._showCount = 150;
    }

    close() {
        this._showCount = 0;
    }

    refresh() {
        this.contents.clear();
        if (managers.State.$gameMap.displayName()) {
            var width = this.contentsWidth();
            this.drawBackground(0, 0, width, this.lineHeight());
            this.drawText(managers.State.$gameMap.displayName(), 0, 0, width, 'center');
        }
    }

    drawBackground(x, y, width, height) {
        var color1 = this.dimColor1();
        var color2 = this.dimColor2();
        this.contents.gradientFillRect(x, y, width / 2, height, color2, color1);
        this.contents.gradientFillRect(x + width / 2, y, width / 2, height, color1, color2);
    }
}

export {MapName};
