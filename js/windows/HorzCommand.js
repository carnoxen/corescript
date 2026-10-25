import * as windows from './index.js';

//-----------------------------------------------------------------------------
// HorzCommand
//
// The command window for the horizontal selection format.
class HorzCommand extends windows.Command {
    initialize(x, y) {
        super.initialize(x, y);
    }

    numVisibleRows() {
        return 1;
    }

    maxCols() {
        return 4;
    }

    itemTextAlign() {
        return 'center';
    }
}

export {HorzCommand};
