import * as core from '../core/index.js';
import * as managers from '../managers/index.js';

//-----------------------------------------------------------------------------
// StateIcon
//
// The sprite for displaying state icons.
class StateIcon extends core.Sprite {
    initialize() {
        super.initialize();
        this.initMembers();
        this.loadBitmap();
    }

    static _iconWidth = 32;

    static _iconHeight = 32;

    initMembers() {
        this._battler = null;
        this._iconIndex = 0;
        this._animationCount = 0;
        this._animationIndex = 0;
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
    }

    loadBitmap() {
        this.bitmap = managers.ImageManager.loadSystem('IconSet');
        this.setFrame(0, 0, 0, 0);
    }

    setup(battler) {
        this._battler = battler;
    }

    update() {
        super.update();
        this._animationCount++;
        if (this._animationCount >= this.animationWait()) {
            this.updateIcon();
            this.updateFrame();
            this._animationCount = 0;
        }
    }

    animationWait() {
        return 40;
    }

    updateIcon() {
        var icons = [];
        if (this._battler && this._battler.isAlive()) {
            icons = this._battler.allIcons();
        }
        if (icons.length > 0) {
            this._animationIndex++;
            if (this._animationIndex >= icons.length) {
                this._animationIndex = 0;
            }
            this._iconIndex = icons[this._animationIndex];
        } else {
            this._animationIndex = 0;
            this._iconIndex = 0;
        }
    }

    updateFrame() {
        var pw = StateIcon._iconWidth;
        var ph = StateIcon._iconHeight;
        var sx = this._iconIndex % 16 * pw;
        var sy = Math.floor(this._iconIndex / 16) * ph;
        this.setFrame(sx, sy, pw, ph);
    }
}

export {StateIcon};
