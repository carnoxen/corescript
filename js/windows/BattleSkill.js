import * as windows from './index.js';

//-----------------------------------------------------------------------------
// BattleSkill
//
// The window for selecting a skill to use on the battle screen.
class BattleSkill extends windows.SkillList {
    initialize(x, y, width, height) {
        super.initialize(x, y, width, height);
        this.hide();
    }

    show() {
        this.selectLast();
        this.showHelpWindow();
        super.show();
    }

    hide() {
        this.hideHelpWindow();
        super.hide();
    }
}

export {BattleSkill};
