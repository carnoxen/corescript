import * as managers from './index.js';
import * as objects from '../objects/index.js';
import * as scenes from '../scenes/index.js';

//-----------------------------------------------------------------------------
// BattleManager
//
// The static class that manages battle progress.
const BattleManager = {
    setup(troopId, canEscape, canLose) {
        this.initMembers();
        this._canEscape = canEscape;
        this._canLose = canLose;
        managers.State.$gameTroop.setup(troopId);
        managers.State.$gameScreen.onBattleStart();
        this.makeEscapeRatio();
    },

    initMembers() {
        this._phase = 'init';
        this._canEscape = false;
        this._canLose = false;
        this._battleTest = false;
        this._eventCallback = null;
        this._preemptive = false;
        this._surprise = false;
        this._actorIndex = -1;
        this._actionForcedBattler = null;
        this._mapBgm = null;
        this._mapBgs = null;
        this._actionBattlers = [];
        this._subject = null;
        this._action = null;
        this._targets = [];
        this._logWindow = null;
        this._statusWindow = null;
        this._spriteset = null;
        this._escapeRatio = 0;
        this._escaped = false;
        this._rewards = {};
        this._turnForced = false;
    },

    isBattleTest() {
        return this._battleTest;
    },

    setBattleTest(battleTest) {
        this._battleTest = battleTest;
    },

    setEventCallback(callback) {
        this._eventCallback = callback;
    },

    setLogWindow(logWindow) {
        this._logWindow = logWindow;
    },

    setStatusWindow(statusWindow) {
        this._statusWindow = statusWindow;
    },

    setSpriteset(spriteset) {
        this._spriteset = spriteset;
    },

    onEncounter() {
        this._preemptive = (Math.random() < this.ratePreemptive());
        this._surprise = (Math.random() < this.rateSurprise() && !this._preemptive);
    },

    ratePreemptive() {
        return managers.State.$gameParty.ratePreemptive(managers.State.$gameTroop.agility());
    },

    rateSurprise() {
        return managers.State.$gameParty.rateSurprise(managers.State.$gameTroop.agility());
    },

    saveBgmAndBgs() {
        this._mapBgm = managers.AudioManager.saveBgm();
        this._mapBgs = managers.AudioManager.saveBgs();
    },

    playBattleBgm() {
        managers.AudioManager.playBgm(managers.State.$gameSystem.battleBgm());
        managers.AudioManager.stopBgs();
    },

    playVictoryMe() {
        managers.AudioManager.playMe(managers.State.$gameSystem.victoryMe());
    },

    playDefeatMe() {
        managers.AudioManager.playMe(managers.State.$gameSystem.defeatMe());
    },

    replayBgmAndBgs() {
        if (this._mapBgm) {
            managers.AudioManager.replayBgm(this._mapBgm);
        } else {
            managers.AudioManager.stopBgm();
        }
        if (this._mapBgs) {
            managers.AudioManager.replayBgs(this._mapBgs);
        }
    },

    makeEscapeRatio() {
        this._escapeRatio = 0.5 * managers.State.$gameParty.agility() / managers.State.$gameTroop.agility();
    },

    update() {
        if (!this.isBusy() && !this.updateEvent()) {
            switch (this._phase) {
            case 'start':
                this.startInput();
                break;
            case 'turn':
                this.updateTurn();
                break;
            case 'action':
                this.updateAction();
                break;
            case 'turnEnd':
                this.updateTurnEnd();
                break;
            case 'battleEnd':
                this.updateBattleEnd();
                break;
            }
        }
    },

    updateEvent() {
        switch (this._phase) {
            case 'start':
            case 'turn':
            case 'turnEnd':
                if (this.isActionForced()) {
                    this.processForcedAction();
                    return true;
                } else {
                    return this.updateEventMain();
                }
        }
        return this.checkAbort();
    },

    updateEventMain() {
        managers.State.$gameTroop.updateInterpreter();
        managers.State.$gameParty.requestMotionRefresh();
        if (managers.State.$gameTroop.isEventRunning() || this.checkBattleEnd()) {
            return true;
        }
        managers.State.$gameTroop.setupBattleEvent();
        if (managers.State.$gameTroop.isEventRunning() || managers.SceneManager.isSceneChanging()) {
            return true;
        }
        return false;
    },

    isBusy() {
        return (managers.State.$gameMessage.isBusy() || this._spriteset.isBusy() ||
                this._logWindow.isBusy());
    },

    isInputting() {
        return this._phase === 'input';
    },

    isInTurn() {
        return this._phase === 'turn';
    },

    isTurnEnd() {
        return this._phase === 'turnEnd';
    },

    isAborting() {
        return this._phase === 'aborting';
    },

    isBattleEnd() {
        return this._phase === 'battleEnd';
    },

    canEscape() {
        return this._canEscape;
    },

    canLose() {
        return this._canLose;
    },

    isEscaped() {
        return this._escaped;
    },

    actor() {
        return this._actorIndex >= 0 ? managers.State.$gameParty.members()[this._actorIndex] : null;
    },

    clearActor() {
        this.changeActor(-1, '');
    },

    changeActor(newActorIndex, lastActorActionState) {
        var lastActor = this.actor();
        this._actorIndex = newActorIndex;
        var newActor = this.actor();
        if (lastActor) {
            lastActor.setActionState(lastActorActionState);
        }
        if (newActor) {
            newActor.setActionState('inputting');
        }
    },

    startBattle() {
        this._phase = 'start';
        managers.State.$gameSystem.onBattleStart();
        managers.State.$gameParty.onBattleStart();
        managers.State.$gameTroop.onBattleStart();
        this.displayStartMessages();
    },

    displayStartMessages() {
        managers.State.$gameTroop.enemyNames().forEach(function(name) {
            managers.State.$gameMessage.add(managers.TextManager.emerge.format(name));
        });
        if (this._preemptive) {
            managers.State.$gameMessage.add(managers.TextManager.preemptive.format(managers.State.$gameParty.name()));
        } else if (this._surprise) {
            managers.State.$gameMessage.add(managers.TextManager.surprise.format(managers.State.$gameParty.name()));
        }
    },

    startInput() {
        this._phase = 'input';
        managers.State.$gameParty.makeActions();
        managers.State.$gameTroop.makeActions();
        this.clearActor();
        if (this._surprise || !managers.State.$gameParty.canInput()) {
            this.startTurn();
        }
    },

    inputtingAction() {
        var actor = this.actor();
        return actor ? actor.inputtingAction() : null;
    },

    selectNextCommand() {
        do {
            var actor = this.actor();
            if (!actor || !actor.selectNextCommand()) {
                this.changeActor(this._actorIndex + 1, 'waiting');
                if (this._actorIndex >= managers.State.$gameParty.size()) {
                    this.startTurn();
                    break;
                }
            }
        } while (!this.actor().canInput());
    },

    selectPreviousCommand() {
        do {
            var actor =this.actor();
            if (!actor || !actor.selectPreviousCommand()) {
                this.changeActor(this._actorIndex - 1, 'undecided');
                if (this._actorIndex < 0) {
                    return;
                }
            }
        } while (!this.actor().canInput());
    },

    refreshStatus() {
        this._statusWindow.refresh();
    },

    startTurn() {
        this._phase = 'turn';
        this.clearActor();
        managers.State.$gameTroop.increaseTurn();
        this.makeActionOrders();
        managers.State.$gameParty.requestMotionRefresh();
        this._logWindow.startTurn();
    },

    updateTurn() {
        managers.State.$gameParty.requestMotionRefresh();
        if (!this._subject) {
            this._subject = this.getNextSubject();
        }
        if (this._subject) {
            this.processTurn();
        } else {
            this.endTurn();
        }
    },

    processTurn() {
        var subject = this._subject;
        var action = subject.currentAction();
        if (action) {
            action.prepare();
            if (action.isValid()) {
                this.startAction();
            }
            subject.removeCurrentAction();
        } else {
            subject.onAllActionsEnd();
            this.refreshStatus();
            this._logWindow.displayAutoAffectedStatus(subject);
            this._logWindow.displayCurrentState(subject);
            this._logWindow.displayRegeneration(subject);
            this._subject = this.getNextSubject();
        }
    },

    endTurn() {
        this._phase = 'turnEnd';
        this._preemptive = false;
        this._surprise = false;
        this.allBattleMembers().forEach(function(battler) {
            battler.onTurnEnd();
            this.refreshStatus();
            this._logWindow.displayAutoAffectedStatus(battler);
            this._logWindow.displayRegeneration(battler);
        }, this);
        if (this.isForcedTurn()) {
            this._turnForced = false;
        }
    },

    isForcedTurn() {
        return this._turnForced;
    },

    updateTurnEnd() {
        this.startInput();
    },

    getNextSubject() {
        for (;;) {
            var battler = this._actionBattlers.shift();
            if (!battler) {
                return null;
            }
            if (battler.isBattleMember() && battler.isAlive()) {
                return battler;
            }
        }
    },

    allBattleMembers() {
        return managers.State.$gameParty.members().concat(managers.State.$gameTroop.members());
    },

    makeActionOrders() {
        var battlers = [];
        if (!this._surprise) {
            battlers = battlers.concat(managers.State.$gameParty.members());
        }
        if (!this._preemptive) {
            battlers = battlers.concat(managers.State.$gameTroop.members());
        }
        battlers.forEach(function(battler) {
            battler.makeSpeed();
        });
        battlers.sort(function(a, b) {
            return b.speed() - a.speed();
        });
        this._actionBattlers = battlers;
    },

    startAction() {
        var subject = this._subject;
        var action = subject.currentAction();
        var targets = action.makeTargets();
        this._phase = 'action';
        this._action = action;
        this._targets = targets;
        subject.useItem(action.item());
        this._action.applyGlobal();
        this.refreshStatus();
        this._logWindow.startAction(subject, action, targets);
    },

    updateAction() {
        var target = this._targets.shift();
        if (target) {
            this.invokeAction(this._subject, target);
        } else {
            this.endAction();
        }
    },

    endAction() {
        this._logWindow.endAction(this._subject);
        this._phase = 'turn';
    },

    invokeAction(subject, target) {
        this._logWindow.push('pushBaseLine');
        if (Math.random() < this._action.itemCnt(target)) {
            this.invokeCounterAttack(subject, target);
        } else if (Math.random() < this._action.itemMrf(target)) {
            this.invokeMagicReflection(subject, target);
        } else {
            this.invokeNormalAction(subject, target);
        }
        subject.setLastTarget(target);
        this._logWindow.push('popBaseLine');
        this.refreshStatus();
    },

    invokeNormalAction(subject, target) {
        var realTarget = this.applySubstitute(target);
        this._action.apply(realTarget);
        this._logWindow.displayActionResults(subject, realTarget);
    },

    invokeCounterAttack(subject, target) {
        var action = new objects.Action(target);
        action.setAttack();
        action.apply(subject);
        this._logWindow.displayCounter(target);
        this._logWindow.displayActionResults(target, subject);
    },

    invokeMagicReflection(subject, target) {
        this._action._reflectionTarget = target;
        this._logWindow.displayReflection(target);
        this._action.apply(subject);
        this._logWindow.displayActionResults(target, subject);
    },

    applySubstitute(target) {
        if (this.checkSubstitute(target)) {
            var substitute = target.friendsUnit().substituteBattler();
            if (substitute && target !== substitute) {
                this._logWindow.displaySubstitute(substitute, target);
                return substitute;
            }
        }
        return target;
    },

    checkSubstitute(target) {
        return target.isDying() && !this._action.isCertainHit();
    },

    isActionForced() {
        return !!this._actionForcedBattler;
    },

    forceAction(battler) {
        this._actionForcedBattler = battler;
        var index = this._actionBattlers.indexOf(battler);
        if (index >= 0) {
            this._actionBattlers.splice(index, 1);
        }
    },

    processForcedAction() {
        if (this._actionForcedBattler) {
            this._turnForced = true;
            this._subject = this._actionForcedBattler;
            this._actionForcedBattler = null;
            this.startAction();
            this._subject.removeCurrentAction();
        }
    },

    abort() {
        this._phase = 'aborting';
    },

    checkBattleEnd() {
        if (this._phase) {
            if (this.checkAbort()) {
                return true;
            } else if (managers.State.$gameParty.isAllDead()) {
                this.processDefeat();
                return true;
            } else if (managers.State.$gameTroop.isAllDead()) {
                this.processVictory();
                return true;
            }
        }
        return false;
    },

    checkAbort() {
        if (managers.State.$gameParty.isEmpty() || this.isAborting()) {
            managers.SoundManager.playEscape();
            this._escaped = true;
            this.processAbort();
        }
        return false;
    },

    processVictory() {
        managers.State.$gameParty.removeBattleStates();
        managers.State.$gameParty.performVictory();
        this.playVictoryMe();
        this.replayBgmAndBgs();
        this.makeRewards();
        this.displayVictoryMessage();
        this.displayRewards();
        this.gainRewards();
        this.endBattle(0);
    },

    processEscape() {
        managers.State.$gameParty.performEscape();
        managers.SoundManager.playEscape();
        var success = this._preemptive ? true : (Math.random() < this._escapeRatio);
        if (success) {
            this.displayEscapeSuccessMessage();
            this._escaped = true;
            this.processAbort();
        } else {
            this.displayEscapeFailureMessage();
            this._escapeRatio += 0.1;
            managers.State.$gameParty.clearActions();
            this.startTurn();
        }
        return success;
    },

    processAbort() {
        managers.State.$gameParty.removeBattleStates();
        this.replayBgmAndBgs();
        this.endBattle(1);
    },

    processDefeat() {
        this.displayDefeatMessage();
        this.playDefeatMe();
        if (this._canLose) {
            this.replayBgmAndBgs();
        } else {
            managers.AudioManager.stopBgm();
        }
        this.endBattle(2);
    },

    endBattle(result) {
        this._phase = 'battleEnd';
        if (this._eventCallback) {
            this._eventCallback(result);
        }
        if (result === 0) {
            managers.State.$gameSystem.onBattleWin();
        } else if (this._escaped) {
            managers.State.$gameSystem.onBattleEscape();
        }
    },

    updateBattleEnd() {
        if (this.isBattleTest()) {
            managers.AudioManager.stopBgm();
            managers.SceneManager.exit();
        } else if (!this._escaped && managers.State.$gameParty.isAllDead()) {
            if (this._canLose) {
                managers.State.$gameParty.reviveBattleMembers();
                managers.SceneManager.pop();
            } else {
                managers.SceneManager.goto(scenes.Gameover);
            }
        } else {
            managers.SceneManager.pop();
        }
        this._phase = null;
    },

    makeRewards() {
        this._rewards = {};
        this._rewards.gold = managers.State.$gameTroop.goldTotal();
        this._rewards.exp = managers.State.$gameTroop.expTotal();
        this._rewards.items = managers.State.$gameTroop.makeDropItems();
    },

    displayVictoryMessage() {
        managers.State.$gameMessage.add(managers.TextManager.victory.format(managers.State.$gameParty.name()));
    },

    displayDefeatMessage() {
        managers.State.$gameMessage.add(managers.TextManager.defeat.format(managers.State.$gameParty.name()));
    },

    displayEscapeSuccessMessage() {
        managers.State.$gameMessage.add(managers.TextManager.escapeStart.format(managers.State.$gameParty.name()));
    },

    displayEscapeFailureMessage() {
        managers.State.$gameMessage.add(managers.TextManager.escapeStart.format(managers.State.$gameParty.name()));
        managers.State.$gameMessage.add('\\.' + managers.TextManager.escapeFailure);
    },

    displayRewards() {
        this.displayExp();
        this.displayGold();
        this.displayDropItems();
    },

    displayExp() {
        var exp = this._rewards.exp;
        if (exp > 0) {
            var text = managers.TextManager.obtainExp.format(exp, managers.TextManager.exp);
            managers.State.$gameMessage.add('\\.' + text);
        }
    },

    displayGold() {
        var gold = this._rewards.gold;
        if (gold > 0) {
            managers.State.$gameMessage.add('\\.' + managers.TextManager.obtainGold.format(gold));
        }
    },

    displayDropItems() {
        var items = this._rewards.items;
        if (items.length > 0) {
            managers.State.$gameMessage.newPage();
            items.forEach(function(item) {
                managers.State.$gameMessage.add(managers.TextManager.obtainItem.format(item.name));
            });
        }
    },

    gainRewards() {
        this.gainExp();
        this.gainGold();
        this.gainDropItems();
    },

    gainExp() {
        var exp = this._rewards.exp;
        managers.State.$gameParty.allMembers().forEach(function(actor) {
            actor.gainExp(exp);
        });
    },

    gainGold() {
        managers.State.$gameParty.gainGold(this._rewards.gold);
    },

    gainDropItems() {
        var items = this._rewards.items;
        items.forEach(function(item) {
            managers.State.$gameParty.gainItem(item, 1);
        });
    },
};

export {BattleManager};
