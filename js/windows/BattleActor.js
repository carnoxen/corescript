import * as managers from '../managers/index.js';
import * as windows from './index.js';

//-----------------------------------------------------------------------------
// BattleActor
//
// The window for selecting a target actor on the battle screen.
class BattleActor extends windows.BattleStatus {
    initialize(x, y) {
        super.initialize();
        this.x = x;
        this.y = y;
        this.openness = 255;
        this.hide();
    }

    show() {
        this.select(0);
        super.show();
    }

    hide() {
        super.hide();
        managers.State.$gameParty.select(null);
    }

    select(index) {
        super.select(index);
        managers.State.$gameParty.select(this.actor());
    }

    actor() {
        return managers.State.$gameParty.members()[this.index()];
    }
}

export {BattleActor};
