import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// Gold
//
// The window for displaying the party's gold.
class Gold extends windows.Base {
    initialize(x, y) {
        var width = this.windowWidth();
        var height = this.windowHeight();
        super.initialize(x, y, width, height);
        this.refresh();
    }

    windowWidth() {
        return 240;
    }

    windowHeight() {
        return this.fittingHeight(1);
    }

    refresh() {
        var x = this.textPadding();
        var width = this.contents.width - this.textPadding() * 2;
        this.contents.clear();
        this.drawCurrencyValue(this.value(), this.currencyUnit(), x, 0, width);
    }

    value() {
        return managers.State.$gameParty.gold();
    }

    currencyUnit() {
        return managers.TextManager.currencyUnit;
    }

    open() {
        this.refresh();
        super.open();
    }
}

export {Gold};
