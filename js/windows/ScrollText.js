import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// ScrollText
//
// The window for displaying scrolling text. No frame is displayed, but it
// is handled as a window for convenience.
class ScrollText extends windows.Base {
    initialize() {
        var width = core.Graphics.boxWidth;
        var height = core.Graphics.boxHeight;
        super.initialize(0, 0, width, height);
        this.opacity = 0;
        this.hide();
        this._text = '';
        this._allTextHeight = 0;
    }

    update() {
        super.update();
        if (managers.State.$gameMessage.scrollMode()) {
            if (this._text) {
                this.updateMessage();
            }
            if (!this._text && managers.State.$gameMessage.hasText()) {
                this.startMessage();
            }
        }
    }

    startMessage() {
        this._text = managers.State.$gameMessage.allText();
        this.refresh();
        this.show();
    }

    refresh() {
        var textState = { index: 0 };
        textState.text = this.convertEscapeCharacters(this._text);
        this.resetFontSettings();
        this._allTextHeight = this.calcTextHeight(textState, true);
        this.createContents();
        this.origin.y = -this.height;
        this.drawTextEx(this._text, this.textPadding(), 1);
    }

    contentsHeight() {
        return Math.max(this._allTextHeight, 1);
    }

    updateMessage() {
        this.origin.y += this.scrollSpeed();
        if (this.origin.y >= this.contents.height) {
            this.terminateMessage();
        }
    }

    scrollSpeed() {
        var speed = managers.State.$gameMessage.scrollSpeed() / 2;
        if (this.isFastForward()) {
            speed *= this.fastForwardRate();
        }
        return speed;
    }

    isFastForward() {
        if (managers.State.$gameMessage.scrollNoFast()) {
            return false;
        } else {
            return (core.Input.isPressed('ok') || core.Input.isPressed('shift') ||
                    core.TouchInput.isPressed());
        }
    }

    fastForwardRate() {
        return 3;
    }

    terminateMessage() {
        this._text = null;
        managers.State.$gameMessage.clear();
        this.hide();
    }
}

export {ScrollText};
