import * as core from '../core/index.js';
import * as managers from '../managers/index.js';

//-----------------------------------------------------------------------------
// Timer
//
// The sprite for displaying the timer.
class Timer extends core.Sprite {
    initialize() {
        super.initialize();
        this._seconds = 0;
        this.createBitmap();
        this.update();
    }

    createBitmap() {
        this.bitmap = new core.Bitmap(96, 48);
        this.bitmap.fontSize = 32;
    }

    update() {
        super.update();
        this.updateBitmap();
        this.updatePosition();
        this.updateVisibility();
    }

    updateBitmap() {
        if (this._seconds !== managers.State.$gameTimer.seconds()) {
            this._seconds = managers.State.$gameTimer.seconds();
            this.redraw();
        }
    }

    redraw() {
        var text = this.timerText();
        var width = this.bitmap.width;
        var height = this.bitmap.height;
        this.bitmap.clear();
        this.bitmap.drawText(text, 0, 0, width, height, 'center');
    }

    timerText() {
        var min = Math.floor(this._seconds / 60) % 60;
        var sec = this._seconds % 60;
        return min.padZero(2) + ':' + sec.padZero(2);
    }

    updatePosition() {
        this.x = core.Graphics.width - this.bitmap.width;
        this.y = 0;
    }

    updateVisibility() {
        this.visible = managers.State.$gameTimer.isWorking();
    }
}

export {Timer};
