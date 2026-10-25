import * as core from '../core/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// Help
//
// The window for displaying the description of the selected item.
class Help extends windows.Base {
    initialize(numLines) {
        var width = core.Graphics.boxWidth;
        var height = this.fittingHeight(numLines || 2);
        super.initialize(0, 0, width, height);
        this._text = '';
    }

    setText(text) {
        if (this._text !== text) {
            this._text = text;
            this.refresh();
        }
    }

    clear() {
        this.setText('');
    }

    setItem(item) {
        this.setText(item ? item.description : '');
    }

    refresh() {
        this.contents.clear();
        this.drawTextEx(this._text, this.textPadding(), 0);
    }
}

export {Help};
