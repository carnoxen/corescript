import * as managers from '../managers/index.js';
import * as objects from './index.js';

//-----------------------------------------------------------------------------
// Enemy
//
// The game object class for an enemy.
class Enemy extends objects.Battler {
    initialize(enemyId, x, y) {
        super.initialize();
        this.setup(enemyId, x, y);
    }

    initMembers() {
        super.initMembers();
        this._enemyId = 0;
        this._letter = '';
        this._plural = false;
        this._screenX = 0;
        this._screenY = 0;
    }

    setup(enemyId, x, y) {
        this._enemyId = enemyId;
        this._screenX = x;
        this._screenY = y;
        this.recoverAll();
    }

    isEnemy() {
        return true;
    }

    friendsUnit() {
        return managers.State.$gameTroop;
    }

    opponentsUnit() {
        return managers.State.$gameParty;
    }

    index() {
        return managers.State.$gameTroop.members().indexOf(this);
    }

    isBattleMember() {
        return this.index() >= 0;
    }

    enemyId() {
        return this._enemyId;
    }

    enemy() {
        return managers.State.$dataEnemies[this._enemyId];
    }

    traitObjects() {
        return super.traitObjects().concat(this.enemy());
    }

    paramBase(paramId) {
        return this.enemy().params[paramId];
    }

    exp() {
        return this.enemy().exp;
    }

    gold() {
        return this.enemy().gold;
    }

    makeDropItems() {
        return this.enemy().dropItems.reduce(function(r, di) {
            if (di.kind > 0 && Math.random() * di.denominator < this.dropItemRate()) {
                return r.concat(this.itemObject(di.kind, di.dataId));
            } else {
                return r;
            }
        }.bind(this), []);
    }

    dropItemRate() {
        return managers.State.$gameParty.hasDropItemDouble() ? 2 : 1;
    }

    itemObject(kind, dataId) {
        if (kind === 1) {
            return managers.State.$dataItems[dataId];
        } else if (kind === 2) {
            return managers.State.$dataWeapons[dataId];
        } else if (kind === 3) {
            return managers.State.$dataArmors[dataId];
        } else {
            return null;
        }
    }

    isSpriteVisible() {
        return true;
    }

    screenX() {
        return this._screenX;
    }

    screenY() {
        return this._screenY;
    }

    battlerName() {
        return this.enemy().battlerName;
    }

    battlerHue() {
        return this.enemy().battlerHue;
    }

    originalName() {
        return this.enemy().name;
    }

    name() {
        return this.originalName() + (this._plural ? this._letter : '');
    }

    isLetterEmpty() {
        return this._letter === '';
    }

    setLetter(letter) {
        this._letter = letter;
    }

    setPlural(plural) {
        this._plural = plural;
    }

    performActionStart(action) {
        super.performActionStart(action);
        this.requestEffect('whiten');
    }

    performAction(action) {
        super.performAction(action);
    }

    performActionEnd() {
        super.performActionEnd();
    }

    performDamage() {
        super.performDamage();
        managers.SoundManager.playEnemyDamage();
        this.requestEffect('blink');
    }

    performCollapse() {
        super.performCollapse();
        switch (this.collapseType()) {
        case 0:
            this.requestEffect('collapse');
            managers.SoundManager.playEnemyCollapse();
            break;
        case 1:
            this.requestEffect('bossCollapse');
            managers.SoundManager.playBossCollapse1();
            break;
        case 2:
            this.requestEffect('instantCollapse');
            break;
        }
    }

    transform(enemyId) {
        var name = this.originalName();
        this._enemyId = enemyId;
        if (this.originalName() !== name) {
            this._letter = '';
            this._plural = false;
        }
        this.refresh();
        if (this.numActions() > 0) {
            this.makeActions();
        }
    }

    meetsCondition(action) {
        var param1 = action.conditionParam1;
        var param2 = action.conditionParam2;
        switch (action.conditionType) {
        case 1:
            return this.meetsTurnCondition(param1, param2);
        case 2:
            return this.meetsHpCondition(param1, param2);
        case 3:
            return this.meetsMpCondition(param1, param2);
        case 4:
            return this.meetsStateCondition(param1);
        case 5:
            return this.meetsPartyLevelCondition(param1);
        case 6:
            return this.meetsSwitchCondition(param1);
        default:
            return true;
        }
    }

    meetsTurnCondition(param1, param2) {
        var n = managers.State.$gameTroop.turnCount();
        if (param2 === 0) {
            return n === param1;
        } else {
            return n > 0 && n >= param1 && n % param2 === param1 % param2;
        }
    }

    meetsHpCondition(param1, param2) {
        return this.hpRate() >= param1 && this.hpRate() <= param2;
    }

    meetsMpCondition(param1, param2) {
        return this.mpRate() >= param1 && this.mpRate() <= param2;
    }

    meetsStateCondition(param) {
        return this.isStateAffected(param);
    }

    meetsPartyLevelCondition(param) {
        return managers.State.$gameParty.highestLevel() >= param;
    }

    meetsSwitchCondition(param) {
        return managers.State.$gameSwitches.value(param);
    }

    isActionValid(action) {
        return this.meetsCondition(action) && this.canUse(managers.State.$dataSkills[action.skillId]);
    }

    selectAction(actionList, ratingZero) {
        var sum = actionList.reduce(function(r, a) {
            return r + a.rating - ratingZero;
        }, 0);
        if (sum > 0) {
            var value = Math.randomInt(sum);
            for (var i = 0; i < actionList.length; i++) {
                var action = actionList[i];
                value -= action.rating - ratingZero;
                if (value < 0) {
                    return action;
                }
            }
        } else {
            return null;
        }
    }

    selectAllActions(actionList) {
        var ratingMax = Math.max.apply(null, actionList.map(function(a) {
            return a.rating;
        }));
        var ratingZero = ratingMax - 3;
        actionList = actionList.filter(function(a) {
            return a.rating > ratingZero;
        });
        for (var i = 0; i < this.numActions(); i++) {
            this.action(i).setEnemyAction(this.selectAction(actionList, ratingZero));
        }
    }

    makeActions() {
        super.makeActions();
        if (this.numActions() > 0) {
            var actionList = this.enemy().actions.filter(function(a) {
                return this.isActionValid(a);
            }, this);
            if (actionList.length > 0) {
                this.selectAllActions(actionList);
            }
        }
        this.setActionState('waiting');
    }
}

export {Enemy};
