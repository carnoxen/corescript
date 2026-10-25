import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as objects from './index.js';
import * as scenes from '../scenes/index.js';
import * as windows from '../windows/index.js';

//-----------------------------------------------------------------------------
// Interpreter
//
// The interpreter for running event commands.
class Interpreter {
    constructor(...args) { this.initialize(...args); }

    initialize(depth) {
        this._depth = depth || 0;
        this.checkOverflow();
        this.clear();
        this._branch = {};
        this._params = [];
        this._indent = 0;
        this._frameCount = 0;
        this._freezeChecker = 0;
    }

    checkOverflow() {
        if (this._depth >= 100) {
            throw new Error('Common event calls exceeded the limit');
        }
    }

    clear() {
        this._mapId = 0;
        this._eventId = 0;
        this._list = null;
        this._index = 0;
        this._waitCount = 0;
        this._waitMode = '';
        this._comments = '';
        this._eventInfo = null;
        this._character = null;
        this._childInterpreter = null;
    }

    setup(list, eventId) {
        this.clear();
        this._mapId = managers.State.$gameMap.mapId();
        this._eventId = eventId || 0;
        this._list = list;
        Interpreter.requestImages(list);
    }

    eventId() {
        return this._eventId;
    }

    isOnCurrentMap() {
        return this._mapId === managers.State.$gameMap.mapId();
    }

    setEventInfo(eventInfo) {
        this._eventInfo = eventInfo;
    }

    setupReservedCommonEvent() {
        if (managers.State.$gameTemp.isCommonEventReserved()) {
            this.setup(managers.State.$gameTemp.reservedCommonEvent().list);
            this.setEventInfo({ eventType: 'common_event', commonEventId: managers.State.$gameTemp.reservedCommonEventId() });
            managers.State.$gameTemp.clearCommonEvent();
            return true;
        } else {
            return false;
        }
    }

    isRunning() {
        return !!this._list;
    }

    update() {
        while (this.isRunning()) {
            if (this.updateChild() || this.updateWait()) {
                break;
            }
            if (managers.SceneManager.isSceneChanging()) {
                break;
            }
            if (!this.executeCommand()) {
                break;
            }
            if (this.checkFreeze()) {
                break;
            }
        }
    }

    updateChild() {
        if (this._childInterpreter) {
            this._childInterpreter.update();
            if (this._childInterpreter.isRunning()) {
                return true;
            } else {
                this._childInterpreter = null;
            }
        }
        return false;
    }

    updateWait() {
        return this.updateWaitCount() || this.updateWaitMode();
    }

    updateWaitCount() {
        if (this._waitCount > 0) {
            this._waitCount--;
            return true;
        }
        return false;
    }

    updateWaitMode() {
        var waiting = false;
        switch (this._waitMode) {
        case 'message':
            waiting = managers.State.$gameMessage.isBusy();
            break;
        case 'transfer':
            waiting = managers.State.$gamePlayer.isTransferring();
            break;
        case 'scroll':
            waiting = managers.State.$gameMap.isScrolling();
            break;
        case 'route':
            waiting = this._character.isMoveRouteForcing();
            break;
        case 'animation':
            waiting = this._character.isAnimationPlaying();
            break;
        case 'balloon':
            waiting = this._character.isBalloonPlaying();
            break;
        case 'gather':
            waiting = managers.State.$gamePlayer.areFollowersGathering();
            break;
        case 'action':
            waiting = managers.BattleManager.isActionForced();
            break;
        case 'video':
            waiting = core.Graphics.isVideoPlaying();
            break;
        case 'image':
            waiting = !managers.ImageManager.isReady();
            break;
        }
        if (!waiting) {
            this._waitMode = '';
        }
        return waiting;
    }

    setWaitMode(waitMode) {
        this._waitMode = waitMode;
    }

    wait(duration) {
        this._waitCount = duration;
    }

    fadeSpeed() {
        return 24;
    }

    executeCommand() {
        var command = this.currentCommand();
        if (command) {
            this._params = command.parameters;
            this._indent = command.indent;
            var methodName = 'command' + command.code;
            if (typeof this[methodName] === 'function') {
                try {
                    if (!this[methodName]()) {
                        return false;
                    }
                } catch (error) {
                    for (var key in this._eventInfo) {
                        error[key] = this._eventInfo[key];
                    }
                    error.eventCommand = error.eventCommand || "other";
                    error.line = error.line || this._index + 1;
                    throw error;
                }
            }
            this._index++;
        } else {
            this.terminate();
        }
        return true;
    }

    checkFreeze() {
        if (this._frameCount !== core.Graphics.frameCount) {
            this._frameCount = core.Graphics.frameCount;
            this._freezeChecker = 0;
        }
        if (this._freezeChecker++ >= 100000) {
            return true;
        } else {
            return false;
        }
    }

    terminate() {
        this._list = null;
        this._comments = '';
    }

    skipBranch() {
        while (this._list[this._index + 1].indent > this._indent) {
            this._index++;
        }
    }

    currentCommand() {
        return this._list[this._index];
    }

    nextEventCode() {
        var command = this._list[this._index + 1];
        if (command) {
            return command.code;
        } else {
            return 0;
        }
    }

    iterateActorId(param, callback) {
        if (param === 0) {
            managers.State.$gameParty.members().forEach(callback);
        } else {
            var actor = managers.State.$gameActors.actor(param);
            if (actor) {
                callback(actor);
            }
        }
    }

    iterateActorEx(param1, param2, callback) {
        if (param1 === 0) {
            this.iterateActorId(param2, callback);
        } else {
            this.iterateActorId(managers.State.$gameVariables.value(param2), callback);
        }
    }

    iterateActorIndex(param, callback) {
        if (param < 0) {
            managers.State.$gameParty.members().forEach(callback);
        } else {
            var actor = managers.State.$gameParty.members()[param];
            if (actor) {
                callback(actor);
            }
        }
    }

    iterateEnemyIndex(param, callback) {
        if (param < 0) {
            managers.State.$gameTroop.members().forEach(callback);
        } else {
            var enemy = managers.State.$gameTroop.members()[param];
            if (enemy) {
                callback(enemy);
            }
        }
    }

    iterateBattler(param1, param2, callback) {
        if (managers.State.$gameParty.inBattle()) {
            if (param1 === 0) {
                this.iterateEnemyIndex(param2, callback);
            } else {
                this.iterateActorId(param2, callback);
            }
        }
    }

    character(param) {
        if (managers.State.$gameParty.inBattle()) {
            return null;
        } else if (param < 0) {
            return managers.State.$gamePlayer;
        } else if (this.isOnCurrentMap()) {
            return managers.State.$gameMap.event(param > 0 ? param : this._eventId);
        } else {
            return null;
        }
    }

    operateValue(operation, operandType, operand) {
        var value = operandType === 0 ? operand : managers.State.$gameVariables.value(operand);
        return operation === 0 ? value : -value;
    }

    changeHp(target, value, allowDeath) {
        if (target.isAlive()) {
            if (!allowDeath && target.hp <= -value) {
                value = 1 - target.hp;
            }
            target.gainHp(value);
            if (target.isDead()) {
                target.performCollapse();
            }
        }
    }

    // Show Text
    command101() {
        if (!managers.State.$gameMessage.isBusy()) {
            managers.State.$gameMessage.setFaceImage(this._params[0], this._params[1]);
            managers.State.$gameMessage.setBackground(this._params[2]);
            managers.State.$gameMessage.setPositionType(this._params[3]);
            while (this.nextEventCode() === 401) {  // Text data
                this._index++;
                managers.State.$gameMessage.add(this.currentCommand().parameters[0]);
            }
            switch (this.nextEventCode()) {
            case 102:  // Show Choices
                this._index++;
                this.setupChoices(this.currentCommand().parameters);
                break;
            case 103:  // Input Number
                this._index++;
                this.setupNumInput(this.currentCommand().parameters);
                break;
            case 104:  // Select Item
                this._index++;
                this.setupItemChoice(this.currentCommand().parameters);
                break;
            }
            this._index++;
            this.setWaitMode('message');
        }
        return false;
    }

    // Show Choices
    command102() {
        if (!managers.State.$gameMessage.isBusy()) {
            this.setupChoices(this._params);
            this._index++;
            this.setWaitMode('message');
        }
        return false;
    }

    setupChoices(params) {
        var choices = params[0].clone();
        var cancelType = params[1];
        var defaultType = params.length > 2 ? params[2] : 0;
        var positionType = params.length > 3 ? params[3] : 2;
        var background = params.length > 4 ? params[4] : 0;
        if (cancelType >= choices.length) {
            cancelType = -2;
        }
        managers.State.$gameMessage.setChoices(choices, defaultType, cancelType);
        managers.State.$gameMessage.setChoiceBackground(background);
        managers.State.$gameMessage.setChoicePositionType(positionType);
        managers.State.$gameMessage.setChoiceCallback(function(n) {
            this._branch[this._indent] = n;
        }.bind(this));
    }

    // When [**]
    command402() {
        if (this._branch[this._indent] !== this._params[0]) {
            this.skipBranch();
        }
        return true;
    }

    // When Cancel
    command403() {
        if (this._branch[this._indent] >= 0) {
            this.skipBranch();
        }
        return true;
    }

    // Input Number
    command103() {
        if (!managers.State.$gameMessage.isBusy()) {
            this.setupNumInput(this._params);
            this._index++;
            this.setWaitMode('message');
        }
        return false;
    }

    setupNumInput(params) {
        managers.State.$gameMessage.setNumberInput(params[0], params[1]);
    }

    // Select Item
    command104() {
        if (!managers.State.$gameMessage.isBusy()) {
            this.setupItemChoice(this._params);
            this._index++;
            this.setWaitMode('message');
        }
        return false;
    }

    setupItemChoice(params) {
        managers.State.$gameMessage.setItemChoice(params[0], params[1] || 2);
    }

    // Show Scrolling Text
    command105() {
        if (!managers.State.$gameMessage.isBusy()) {
            managers.State.$gameMessage.setScroll(this._params[0], this._params[1]);
            while (this.nextEventCode() === 405) {
                this._index++;
                managers.State.$gameMessage.add(this.currentCommand().parameters[0]);
            }
            this._index++;
            this.setWaitMode('message');
        }
        return false;
    }

    // Comment
    command108() {
        this._comments = [this._params[0]];
        while (this.nextEventCode() === 408) {
            this._index++;
            this._comments.push(this.currentCommand().parameters[0]);
        }
        return true;
    }

    // Conditional Branch
    command111() {
        const {$dataActors, $dataClasses, $dataSkills, $dataItems, $dataWeapons, $dataArmors, $dataEnemies, $dataTroops, $dataStates, $dataAnimations, $dataTilesets, $dataCommonEvents, $dataSystem, $dataMapInfos, $dataMap, $gameTemp, $gameSystem, $gameScreen, $gameTimer, $gameMessage, $gameSwitches, $gameVariables, $gameSelfSwitches, $gameActors, $gameParty, $gameTroop, $gameMap, $gamePlayer, $testEvent} = managers.State;
        var result = false;
        switch (this._params[0]) {
            case 0:  // Switch
                result = (managers.State.$gameSwitches.value(this._params[1]) === (this._params[2] === 0));
                break;
            case 1:  // Variable
                var value1 = managers.State.$gameVariables.value(this._params[1]);
                var value2;
                if (this._params[2] === 0) {
                    value2 = this._params[3];
                } else {
                    value2 = managers.State.$gameVariables.value(this._params[3]);
                }
                switch (this._params[4]) {
                    case 0:  // Equal to
                        result = (value1 === value2);
                        break;
                    case 1:  // Greater than or Equal to
                        result = (value1 >= value2);
                        break;
                    case 2:  // Less than or Equal to
                        result = (value1 <= value2);
                        break;
                    case 3:  // Greater than
                        result = (value1 > value2);
                        break;
                    case 4:  // Less than
                        result = (value1 < value2);
                        break;
                    case 5:  // Not Equal to
                        result = (value1 !== value2);
                        break;
                }
                break;
            case 2:  // Self Switch
                if (this._eventId > 0) {
                    var key = [this._mapId, this._eventId, this._params[1]];
                    result = (managers.State.$gameSelfSwitches.value(key) === (this._params[2] === 0));
                }
                break;
            case 3:  // Timer
                if (managers.State.$gameTimer.isWorking()) {
                    if (this._params[2] === 0) {
                        result = (managers.State.$gameTimer.seconds() >= this._params[1]);
                    } else {
                        result = (managers.State.$gameTimer.seconds() <= this._params[1]);
                    }
                }
                break;
            case 4:  // Actor
                var actor = managers.State.$gameActors.actor(this._params[1]);
                if (actor) {
                    var n = this._params[3];
                    switch (this._params[2]) {
                        case 0:  // In the Party
                            result = managers.State.$gameParty.members().contains(actor);
                            break;
                        case 1:  // Name
                            result = (actor.name() === n);
                            break;
                        case 2:  // Class
                            result = actor.isClass(managers.State.$dataClasses[n]);
                            break;
                        case 3:  // Skill
                            result = actor.hasSkill(n);
                            break;
                        case 4:  // Weapon
                            result = actor.hasWeapon(managers.State.$dataWeapons[n]);
                            break;
                        case 5:  // Armor
                            result = actor.hasArmor(managers.State.$dataArmors[n]);
                            break;
                        case 6:  // State
                            result = actor.isStateAffected(n);
                            break;
                    }
                }
                break;
            case 5:  // Enemy
                var enemy = managers.State.$gameTroop.members()[this._params[1]];
                if (enemy) {
                    switch (this._params[2]) {
                        case 0:  // Appeared
                            result = enemy.isAlive();
                            break;
                        case 1:  // State
                            result = enemy.isStateAffected(this._params[3]);
                            break;
                    }
                }
                break;
            case 6:  // Character
                var character = this.character(this._params[1]);
                if (character) {
                    result = (character.direction() === this._params[2]);
                }
                break;
            case 7:  // Gold
                switch (this._params[2]) {
                    case 0:  // Greater than or equal to
                        result = (managers.State.$gameParty.gold() >= this._params[1]);
                        break;
                    case 1:  // Less than or equal to
                        result = (managers.State.$gameParty.gold() <= this._params[1]);
                        break;
                    case 2:  // Less than
                        result = (managers.State.$gameParty.gold() < this._params[1]);
                        break;
                }
                break;
            case 8:  // Item
                result = managers.State.$gameParty.hasItem(managers.State.$dataItems[this._params[1]]);
                break;
            case 9:  // Weapon
                result = managers.State.$gameParty.hasItem(managers.State.$dataWeapons[this._params[1]], this._params[2]);
                break;
            case 10:  // Armor
                result = managers.State.$gameParty.hasItem(managers.State.$dataArmors[this._params[1]], this._params[2]);
                break;
            case 11:  // Button
                result = core.Input.isPressed(this._params[1]);
                break;
            case 12:  // Script
                try {
                    result = !!eval(this._params[1]);
                } catch (error) {
                    error.eventCommand = "conditional_branch_script";
                    error.content = this._params[1];
                    throw error;
                }
                break;
            case 13:  // Vehicle
                result = (managers.State.$gamePlayer.vehicle() === managers.State.$gameMap.vehicle(this._params[1]));
                break;
        }
        this._branch[this._indent] = result;
        if (this._branch[this._indent] === false) {
            this.skipBranch();
        }
        return true;
    }

    // Else
    command411() {
        if (this._branch[this._indent] !== false) {
            this.skipBranch();
        }
        return true;
    }

    // Loop
    command112() {
        return true;
    }

    // Repeat Above
    command413() {
        do {
            this._index--;
        } while (this.currentCommand().indent !== this._indent);
        return true;
    }

    // Break Loop
    command113() {
        var depth = 0;
        while (this._index < this._list.length - 1) {
            this._index++;
            var command = this.currentCommand();

            if (command.code === 112)
                depth++;

            if (command.code === 413) {
                if (depth > 0)
                    depth--;
                else
                    break;
            }
        }
        return true;
    }

    // Exit Event Processing
    command115() {
        this._index = this._list.length;
        return true;
    }

    // Common Event
    command117() {
        var commonEvent = managers.State.$dataCommonEvents[this._params[0]];
        if (commonEvent) {
            var eventId = this.isOnCurrentMap() ? this._eventId : 0;
            this.setupChild(commonEvent.list, eventId);
        }
        return true;
    }

    setupChild(list, eventId) {
        this._childInterpreter = new Interpreter(this._depth + 1);
        this._childInterpreter.setup(list, eventId);
        this._childInterpreter.setEventInfo({ eventType: 'common_event', commonEventId: this._params[0] });
    }

    // Label
    command118() {
        return true;
    }

    // Jump to Label
    command119() {
        var labelName = this._params[0];
        for (var i = 0; i < this._list.length; i++) {
            var command = this._list[i];
            if (command.code === 118 && command.parameters[0] === labelName) {
                this.jumpTo(i);
                return;
            }
        }
        return true;
    }

    jumpTo(index) {
        var lastIndex = this._index;
        var startIndex = Math.min(index, lastIndex);
        var endIndex = Math.max(index, lastIndex);
        var indent = this._indent;
        for (var i = startIndex; i <= endIndex; i++) {
            var newIndent = this._list[i].indent;
            if (newIndent !== indent) {
                this._branch[indent] = null;
                indent = newIndent;
            }
        }
        this._index = index;
    }

    // Control Switches
    command121() {
        for (var i = this._params[0]; i <= this._params[1]; i++) {
            managers.State.$gameSwitches.setValue(i, this._params[2] === 0);
        }
        return true;
    }

    // Control Variables
    command122() {
        const {$dataActors, $dataClasses, $dataSkills, $dataItems, $dataWeapons, $dataArmors, $dataEnemies, $dataTroops, $dataStates, $dataAnimations, $dataTilesets, $dataCommonEvents, $dataSystem, $dataMapInfos, $dataMap, $gameTemp, $gameSystem, $gameScreen, $gameTimer, $gameMessage, $gameSwitches, $gameVariables, $gameSelfSwitches, $gameActors, $gameParty, $gameTroop, $gameMap, $gamePlayer, $testEvent} = managers.State;
        var value = 0;
        switch (this._params[3]) { // Operand
            case 0: // Constant
                value = this._params[4];
                break;
            case 1: // Variable
                value = managers.State.$gameVariables.value(this._params[4]);
                break;
            case 2: // Random
                value = this._params[5] - this._params[4] + 1;
                for (var i = this._params[0]; i <= this._params[1]; i++) {
                    this.operateVariable(i, this._params[2], this._params[4] + Math.randomInt(value));
                }
                return true;
                break;
            case 3: // Game Data
                value = this.gameDataOperand(this._params[4], this._params[5], this._params[6]);
                break;
            case 4: // Script
                try {
                    value = eval(this._params[4]);
                } catch (error) {
                    error.eventCommand = "control_variables";
                    error.content = this._params[4];
                    throw error;
                }
                break;
        }
        for (var i = this._params[0]; i <= this._params[1]; i++) {
            this.operateVariable(i, this._params[2], value);
        }
        return true;
    }

    gameDataOperand(type, param1, param2) {
        switch (type) {
        case 0:  // Item
            return managers.State.$gameParty.numItems(managers.State.$dataItems[param1]);
        case 1:  // Weapon
            return managers.State.$gameParty.numItems(managers.State.$dataWeapons[param1]);
        case 2:  // Armor
            return managers.State.$gameParty.numItems(managers.State.$dataArmors[param1]);
        case 3:  // Actor
            var actor = managers.State.$gameActors.actor(param1);
            if (actor) {
                switch (param2) {
                case 0:  // Level
                    return actor.level;
                case 1:  // EXP
                    return actor.currentExp();
                case 2:  // HP
                    return actor.hp;
                case 3:  // MP
                    return actor.mp;
                default:    // Parameter
                    if (param2 >= 4 && param2 <= 11) {
                        return actor.param(param2 - 4);
                    }
                }
            }
            break;
        case 4:  // Enemy
            var enemy = managers.State.$gameTroop.members()[param1];
            if (enemy) {
                switch (param2) {
                case 0:  // HP
                    return enemy.hp;
                case 1:  // MP
                    return enemy.mp;
                default:    // Parameter
                    if (param2 >= 2 && param2 <= 9) {
                        return enemy.param(param2 - 2);
                    }
                }
            }
            break;
        case 5:  // Character
            var character = this.character(param1);
            if (character) {
                switch (param2) {
                case 0:  // Map X
                    return character.x;
                case 1:  // Map Y
                    return character.y;
                case 2:  // Direction
                    return character.direction();
                case 3:  // Screen X
                    return character.screenX();
                case 4:  // Screen Y
                    return character.screenY();
                }
            }
            break;
        case 6:  // Party
            actor = managers.State.$gameParty.members()[param1];
            return actor ? actor.actorId() : 0;
        case 7:  // Other
            switch (param1) {
            case 0:  // Map ID
                return managers.State.$gameMap.mapId();
            case 1:  // Party Members
                return managers.State.$gameParty.size();
            case 2:  // Gold
                return managers.State.$gameParty.gold();
            case 3:  // Steps
                return managers.State.$gameParty.steps();
            case 4:  // Play Time
                return managers.State.$gameSystem.playtime();
            case 5:  // Timer
                return managers.State.$gameTimer.seconds();
            case 6:  // Save Count
                return managers.State.$gameSystem.saveCount();
            case 7:  // Battle Count
                return managers.State.$gameSystem.battleCount();
            case 8:  // Win Count
                return managers.State.$gameSystem.winCount();
            case 9:  // Escape Count
                return managers.State.$gameSystem.escapeCount();
            }
            break;
        }
        return 0;
    }

    operateVariable(variableId, operationType, value) {
        try {
            var oldValue = managers.State.$gameVariables.value(variableId);
            switch (operationType) {
            case 0:  // Set
                managers.State.$gameVariables.setValue(variableId, oldValue = value);
                break;
            case 1:  // Add
                managers.State.$gameVariables.setValue(variableId, oldValue + value);
                break;
            case 2:  // Sub
                managers.State.$gameVariables.setValue(variableId, oldValue - value);
                break;
            case 3:  // Mul
                managers.State.$gameVariables.setValue(variableId, oldValue * value);
                break;
            case 4:  // Div
                managers.State.$gameVariables.setValue(variableId, oldValue / value);
                break;
            case 5:  // Mod
                managers.State.$gameVariables.setValue(variableId, oldValue % value);
                break;
            }
        } catch (e) {
            managers.State.$gameVariables.setValue(variableId, 0);
        }
    }

    // Control Self Switch
    command123() {
        if (this._eventId > 0) {
            var key = [this._mapId, this._eventId, this._params[0]];
            managers.State.$gameSelfSwitches.setValue(key, this._params[1] === 0);
        }
        return true;
    }

    // Control Timer
    command124() {
        if (this._params[0] === 0) {  // Start
            managers.State.$gameTimer.start(this._params[1] * 60);
        } else {  // Stop
            managers.State.$gameTimer.stop();
        }
        return true;
    }

    // Change Gold
    command125() {
        var value = this.operateValue(this._params[0], this._params[1], this._params[2]);
        managers.State.$gameParty.gainGold(value);
        return true;
    }

    // Change Items
    command126() {
        var value = this.operateValue(this._params[1], this._params[2], this._params[3]);
        managers.State.$gameParty.gainItem(managers.State.$dataItems[this._params[0]], value);
        return true;
    }

    // Change Weapons
    command127() {
        var value = this.operateValue(this._params[1], this._params[2], this._params[3]);
        managers.State.$gameParty.gainItem(managers.State.$dataWeapons[this._params[0]], value, this._params[4]);
        return true;
    }

    // Change Armors
    command128() {
        var value = this.operateValue(this._params[1], this._params[2], this._params[3]);
        managers.State.$gameParty.gainItem(managers.State.$dataArmors[this._params[0]], value, this._params[4]);
        return true;
    }

    // Change Party Member
    command129() {
        var actor = managers.State.$gameActors.actor(this._params[0]);
        if (actor) {
            if (this._params[1] === 0) {  // Add
                if (this._params[2]) {   // Initialize
                    managers.State.$gameActors.actor(this._params[0]).setup(this._params[0]);
                }
                managers.State.$gameParty.addActor(this._params[0]);
            } else {  // Remove
                managers.State.$gameParty.removeActor(this._params[0]);
            }
        }
        return true;
    }

    // Change Battle BGM
    command132() {
        managers.State.$gameSystem.setBattleBgm(this._params[0]);
        return true;
    }

    // Change Victory ME
    command133() {
        managers.State.$gameSystem.setVictoryMe(this._params[0]);
        return true;
    }

    // Change Save Access
    command134() {
        if (this._params[0] === 0) {
            managers.State.$gameSystem.disableSave();
        } else {
            managers.State.$gameSystem.enableSave();
        }
        return true;
    }

    // Change Menu Access
    command135() {
        if (this._params[0] === 0) {
            managers.State.$gameSystem.disableMenu();
        } else {
            managers.State.$gameSystem.enableMenu();
        }
        return true;
    }

    // Change Encounter Disable
    command136() {
        if (this._params[0] === 0) {
            managers.State.$gameSystem.disableEncounter();
        } else {
            managers.State.$gameSystem.enableEncounter();
        }
        managers.State.$gamePlayer.makeEncounterCount();
        return true;
    }

    // Change Formation Access
    command137() {
        if (this._params[0] === 0) {
            managers.State.$gameSystem.disableFormation();
        } else {
            managers.State.$gameSystem.enableFormation();
        }
        return true;
    }

    // Change Window Color
    command138() {
        managers.State.$gameSystem.setWindowTone(this._params[0]);
        return true;
    }

    // Change Defeat ME
    command139() {
        managers.State.$gameSystem.setDefeatMe(this._params[0]);
        return true;
    }

    // Change Vehicle BGM
    command140() {
        var vehicle = managers.State.$gameMap.vehicle(this._params[0]);
        if (vehicle) {
            vehicle.setBgm(this._params[1]);
        }
        return true;
    }

    // Transfer Player
    command201() {
        if (!managers.State.$gameParty.inBattle() && !managers.State.$gameMessage.isBusy()) {
            var mapId, x, y;
            if (this._params[0] === 0) {  // Direct designation
                mapId = this._params[1];
                x = this._params[2];
                y = this._params[3];
            } else {  // Designation with variables
                mapId = managers.State.$gameVariables.value(this._params[1]);
                x = managers.State.$gameVariables.value(this._params[2]);
                y = managers.State.$gameVariables.value(this._params[3]);
            }
            managers.State.$gamePlayer.reserveTransfer(mapId, x, y, this._params[4], this._params[5]);
            this.setWaitMode('transfer');
            this._index++;
        }
        return false;
    }

    // Set Vehicle Location
    command202() {
        var mapId, x, y;
        if (this._params[1] === 0) {  // Direct designation
            mapId = this._params[2];
            x = this._params[3];
            y = this._params[4];
        } else {  // Designation with variables
            mapId = managers.State.$gameVariables.value(this._params[2]);
            x = managers.State.$gameVariables.value(this._params[3]);
            y = managers.State.$gameVariables.value(this._params[4]);
        }
        var vehicle = managers.State.$gameMap.vehicle(this._params[0]);
        if (vehicle) {
            vehicle.setLocation(mapId, x, y);
        }
        return true;
    }

    // Set Event Location
    command203() {
        var character = this.character(this._params[0]);
        if (character) {
            if (this._params[1] === 0) {  // Direct designation
                character.locate(this._params[2], this._params[3]);
            } else if (this._params[1] === 1) {  // Designation with variables
                var x = managers.State.$gameVariables.value(this._params[2]);
                var y = managers.State.$gameVariables.value(this._params[3]);
                character.locate(x, y);
            } else {  // Exchange with another event
                var character2 = this.character(this._params[2]);
                if (character2) {
                    character.swap(character2);
                }
            }
            if (this._params[4] > 0) {
                character.setDirection(this._params[4]);
            }
        }
        return true;
    }

    // Scroll Map
    command204() {
        if (!managers.State.$gameParty.inBattle()) {
            if (managers.State.$gameMap.isScrolling()) {
                this.setWaitMode('scroll');
                return false;
            }
            managers.State.$gameMap.startScroll(this._params[0], this._params[1], this._params[2]);
        }
        return true;
    }

    // Set Movement Route
    command205() {
        managers.State.$gameMap.refreshIfNeeded();
        this._character = this.character(this._params[0]);
        if (this._character) {
            this._character.forceMoveRoute(this._params[1]);
            var eventInfo = core.JsonEx.makeDeepCopy(this._eventInfo);
            eventInfo.line = this._index + 1;
            this._character.setCallerEventInfo(eventInfo);
            if (this._params[1].wait) {
                this.setWaitMode('route');
            }
        }
        return true;
    }

    // Getting On and Off Vehicles
    command206() {
        managers.State.$gamePlayer.getOnOffVehicle();
        return true;
    }

    // Change Transparency
    command211() {
        managers.State.$gamePlayer.setTransparent(this._params[0] === 0);
        return true;
    }

    // Show Animation
    command212() {
        this._character = this.character(this._params[0]);
        if (this._character) {
            this._character.requestAnimation(this._params[1]);
            if (this._params[2]) {
                this.setWaitMode('animation');
            }
        }
        return true;
    }

    // Show Balloon Icon
    command213() {
        this._character = this.character(this._params[0]);
        if (this._character) {
            this._character.requestBalloon(this._params[1]);
            if (this._params[2]) {
                this.setWaitMode('balloon');
            }
        }
        return true;
    }

    // Erase Event
    command214() {
        if (this.isOnCurrentMap() && this._eventId > 0) {
            managers.State.$gameMap.eraseEvent(this._eventId);
        }
        return true;
    }

    // Change Player Followers
    command216() {
        if (this._params[0] === 0) {
            managers.State.$gamePlayer.showFollowers();
        } else {
            managers.State.$gamePlayer.hideFollowers();
        }
        managers.State.$gamePlayer.refresh();
        return true;
    }

    // Gather Followers
    command217() {
        if (!managers.State.$gameParty.inBattle()) {
            managers.State.$gamePlayer.gatherFollowers();
            this.setWaitMode('gather');
        }
        return true;
    }

    // Fadeout Screen
    command221() {
        if (!managers.State.$gameMessage.isBusy()) {
            managers.State.$gameScreen.startFadeOut(this.fadeSpeed());
            this.wait(this.fadeSpeed());
            this._index++;
        }
        return false;
    }

    // Fadein Screen
    command222() {
        if (!managers.State.$gameMessage.isBusy()) {
            managers.State.$gameScreen.startFadeIn(this.fadeSpeed());
            this.wait(this.fadeSpeed());
            this._index++;
        }
        return false;
    }

    // Tint Screen
    command223() {
        managers.State.$gameScreen.startTint(this._params[0], this._params[1]);
        if (this._params[2]) {
            this.wait(this._params[1]);
        }
        return true;
    }

    // Flash Screen
    command224() {
        managers.State.$gameScreen.startFlash(this._params[0], this._params[1]);
        if (this._params[2]) {
            this.wait(this._params[1]);
        }
        return true;
    }

    // Shake Screen
    command225() {
        managers.State.$gameScreen.startShake(this._params[0], this._params[1], this._params[2]);
        if (this._params[3]) {
            this.wait(this._params[2]);
        }
        return true;
    }

    // Wait
    command230() {
        this.wait(this._params[0]);
        return true;
    }

    // Show Picture
    command231() {
        var x, y;
        if (this._params[3] === 0) {  // Direct designation
            x = this._params[4];
            y = this._params[5];
        } else {  // Designation with variables
            x = managers.State.$gameVariables.value(this._params[4]);
            y = managers.State.$gameVariables.value(this._params[5]);
        }
        managers.State.$gameScreen.showPicture(this._params[0], this._params[1], this._params[2],
            x, y, this._params[6], this._params[7], this._params[8], this._params[9]);
        return true;
    }

    // Move Picture
    command232() {
        var x, y;
        if (this._params[3] === 0) {  // Direct designation
            x = this._params[4];
            y = this._params[5];
        } else {  // Designation with variables
            x = managers.State.$gameVariables.value(this._params[4]);
            y = managers.State.$gameVariables.value(this._params[5]);
        }
        managers.State.$gameScreen.movePicture(this._params[0], this._params[2], x, y, this._params[6],
            this._params[7], this._params[8], this._params[9], this._params[10]);
        if (this._params[11]) {
            this.wait(this._params[10]);
        }
        return true;
    }

    // Rotate Picture
    command233() {
        managers.State.$gameScreen.rotatePicture(this._params[0], this._params[1]);
        return true;
    }

    // Tint Picture
    command234() {
        managers.State.$gameScreen.tintPicture(this._params[0], this._params[1], this._params[2]);
        if (this._params[3]) {
            this.wait(this._params[2]);
        }
        return true;
    }

    // Erase Picture
    command235() {
        managers.State.$gameScreen.erasePicture(this._params[0]);
        return true;
    }

    // Set Weather Effect
    command236() {
        if (!managers.State.$gameParty.inBattle()) {
            managers.State.$gameScreen.changeWeather(this._params[0], this._params[1], this._params[2]);
            if (this._params[3]) {
                this.wait(this._params[2]);
            }
        }
        return true;
    }

    // Play BGM
    command241() {
        managers.AudioManager.playBgm(this._params[0]);
        return true;
    }

    // Fadeout BGM
    command242() {
        managers.AudioManager.fadeOutBgm(this._params[0]);
        return true;
    }

    // Save BGM
    command243() {
        managers.State.$gameSystem.saveBgm();
        return true;
    }

    // Resume BGM
    command244() {
        managers.State.$gameSystem.replayBgm();
        return true;
    }

    // Play BGS
    command245() {
        managers.AudioManager.playBgs(this._params[0]);
        return true;
    }

    // Fadeout BGS
    command246() {
        managers.AudioManager.fadeOutBgs(this._params[0]);
        return true;
    }

    // Play ME
    command249() {
        managers.AudioManager.playMe(this._params[0]);
        return true;
    }

    // Play SE
    command250() {
        managers.AudioManager.playSe(this._params[0]);
        return true;
    }

    // Stop SE
    command251() {
        managers.AudioManager.stopSe();
        return true;
    }

    // Play Movie
    command261() {
        if (!managers.State.$gameMessage.isBusy()) {
            var name = this._params[0];
            if (name.length > 0) {
                var ext = this.videoFileExt();
                core.Graphics.playVideo('movies/' + name + ext);
                this.setWaitMode('video');
            }
            this._index++;
        }
        return false;
    }

    videoFileExt() {
        if (core.Graphics.canPlayVideoType('video/webm') && !core.Utils.isMobileDevice()) {
            return '.webm';
        } else {
            return '.mp4';
        }
    }

    // Change Map Name Display
    command281() {
        if (this._params[0] === 0) {
            managers.State.$gameMap.enableNameDisplay();
        } else {
            managers.State.$gameMap.disableNameDisplay();
        }
        return true;
    }

    // Change Tileset
    command282() {
        var tileset = managers.State.$dataTilesets[this._params[0]];
        if(!this._imageReservationId){
            this._imageReservationId = core.Utils.generateRuntimeId();
        }

        var allReady = tileset.tilesetNames.map(function(tilesetName) {
            return managers.ImageManager.reserveTileset(tilesetName, 0, this._imageReservationId);
        }, this).every(function(bitmap) {return bitmap.isReady();});

        if (allReady) {
            managers.State.$gameMap.changeTileset(this._params[0]);
            managers.ImageManager.releaseReservation(this._imageReservationId);
            this._imageReservationId = null;

            return true;
        } else {
            return false;
        }
    }

    // Change Battle Back
    command283() {
        managers.State.$gameMap.changeBattleback(this._params[0], this._params[1]);
        return true;
    }

    // Change Parallax
    command284() {
        managers.State.$gameMap.changeParallax(this._params[0], this._params[1],
            this._params[2], this._params[3], this._params[4]);
        return true;
    }

    // Get Location Info
    command285() {
        var x, y, value;
        if (this._params[2] === 0) {  // Direct designation
            x = this._params[3];
            y = this._params[4];
        } else {  // Designation with variables
            x = managers.State.$gameVariables.value(this._params[3]);
            y = managers.State.$gameVariables.value(this._params[4]);
        }
        switch (this._params[1]) {
        case 0:     // Terrain Tag
            value = managers.State.$gameMap.terrainTag(x, y);
            break;
        case 1:     // Event ID
            value = managers.State.$gameMap.eventIdXy(x, y);
            break;
        case 2:     // Tile ID (Layer 1)
        case 3:     // Tile ID (Layer 2)
        case 4:     // Tile ID (Layer 3)
        case 5:     // Tile ID (Layer 4)
            value = managers.State.$gameMap.tileId(x, y, this._params[1] - 2);
            break;
        default:    // Region ID
            value = managers.State.$gameMap.regionId(x, y);
            break;
        }
        managers.State.$gameVariables.setValue(this._params[0], value);
        return true;
    }

    // Battle Processing
    command301() {
        if (!managers.State.$gameParty.inBattle()) {
            var troopId;
            if (this._params[0] === 0) {  // Direct designation
                troopId = this._params[1];
            } else if (this._params[0] === 1) {  // Designation with a variable
                troopId = managers.State.$gameVariables.value(this._params[1]);
            } else {  // Same as Random Encounter
                troopId = managers.State.$gamePlayer.makeEncounterTroopId();
            }
            if (managers.State.$dataTroops[troopId]) {
                managers.BattleManager.setup(troopId, this._params[2], this._params[3]);
                managers.BattleManager.setEventCallback(function(n) {
                    this._branch[this._indent] = n;
                }.bind(this));
                managers.State.$gamePlayer.makeEncounterCount();
                managers.SceneManager.push(scenes.Battle);
            }
        }
        return true;
    }

    // If Win
    command601() {
        if (this._branch[this._indent] !== 0) {
            this.skipBranch();
        }
        return true;
    }

    // If Escape
    command602() {
        if (this._branch[this._indent] !== 1) {
            this.skipBranch();
        }
        return true;
    }

    // If Lose
    command603() {
        if (this._branch[this._indent] !== 2) {
            this.skipBranch();
        }
        return true;
    }

    // Shop Processing
    command302() {
        if (!managers.State.$gameParty.inBattle()) {
            var goods = [this._params];
            while (this.nextEventCode() === 605) {
                this._index++;
                goods.push(this.currentCommand().parameters);
            }
            managers.SceneManager.push(scenes.Shop);
            managers.SceneManager.prepareNextScene(goods, this._params[4]);
        }
        return true;
    }

    // Name Input Processing
    command303() {
        if (!managers.State.$gameParty.inBattle()) {
            if (managers.State.$dataActors[this._params[0]]) {
                managers.SceneManager.push(scenes.Name);
                managers.SceneManager.prepareNextScene(this._params[0], this._params[1]);
            }
        }
        return true;
    }

    // Change HP
    command311() {
        var value = this.operateValue(this._params[2], this._params[3], this._params[4]);
        this.iterateActorEx(this._params[0], this._params[1], function(actor) {
            this.changeHp(actor, value, this._params[5]);
        }.bind(this));
        return true;
    }

    // Change MP
    command312() {
        var value = this.operateValue(this._params[2], this._params[3], this._params[4]);
        this.iterateActorEx(this._params[0], this._params[1], function(actor) {
            actor.gainMp(value);
        }.bind(this));
        return true;
    }

    // Change TP
    command326() {
        var value = this.operateValue(this._params[2], this._params[3], this._params[4]);
        this.iterateActorEx(this._params[0], this._params[1], function(actor) {
            actor.gainTp(value);
        }.bind(this));
        return true;
    }

    // Change State
    command313() {
        this.iterateActorEx(this._params[0], this._params[1], function(actor) {
            var alreadyDead = actor.isDead();
            if (this._params[2] === 0) {
                actor.addState(this._params[3]);
            } else {
                actor.removeState(this._params[3]);
            }
            if (actor.isDead() && !alreadyDead) {
                actor.performCollapse();
            }
            actor.clearResult();
        }.bind(this));
        return true;
    }

    // Recover All
    command314() {
        this.iterateActorEx(this._params[0], this._params[1], function(actor) {
            actor.recoverAll();
        }.bind(this));
        return true;
    }

    // Change EXP
    command315() {
        var value = this.operateValue(this._params[2], this._params[3], this._params[4]);
        this.iterateActorEx(this._params[0], this._params[1], function(actor) {
            actor.changeExp(actor.currentExp() + value, this._params[5]);
        }.bind(this));
        return true;
    }

    // Change Level
    command316() {
        var value = this.operateValue(this._params[2], this._params[3], this._params[4]);
        this.iterateActorEx(this._params[0], this._params[1], function(actor) {
            actor.changeLevel(actor.level + value, this._params[5]);
        }.bind(this));
        return true;
    }

    // Change Parameter
    command317() {
        var value = this.operateValue(this._params[3], this._params[4], this._params[5]);
        this.iterateActorEx(this._params[0], this._params[1], function(actor) {
            actor.addParam(this._params[2], value);
        }.bind(this));
        return true;
    }

    // Change Skill
    command318() {
        this.iterateActorEx(this._params[0], this._params[1], function(actor) {
            if (this._params[2] === 0) {
                actor.learnSkill(this._params[3]);
            } else {
                actor.forgetSkill(this._params[3]);
            }
        }.bind(this));
        return true;
    }

    // Change Equipment
    command319() {
        var actor = managers.State.$gameActors.actor(this._params[0]);
        if (actor) {
            actor.changeEquipById(this._params[1], this._params[2]);
        }
        return true;
    }

    // Change Name
    command320() {
        var actor = managers.State.$gameActors.actor(this._params[0]);
        if (actor) {
            actor.setName(this._params[1]);
        }
        return true;
    }

    // Change Class
    command321() {
        var actor = managers.State.$gameActors.actor(this._params[0]);
        if (actor && managers.State.$dataClasses[this._params[1]]) {
            actor.changeClass(this._params[1], this._params[2]);
        }
        return true;
    }

    // Change Actor Images
    command322() {
        var actor = managers.State.$gameActors.actor(this._params[0]);
        if (actor) {
            actor.setCharacterImage(this._params[1], this._params[2]);
            actor.setFaceImage(this._params[3], this._params[4]);
            actor.setBattlerImage(this._params[5]);
        }
        managers.State.$gamePlayer.refresh();
        return true;
    }

    // Change Vehicle Image
    command323() {
        var vehicle = managers.State.$gameMap.vehicle(this._params[0]);
        if (vehicle) {
            vehicle.setImage(this._params[1], this._params[2]);
        }
        return true;
    }

    // Change Nickname
    command324() {
        var actor = managers.State.$gameActors.actor(this._params[0]);
        if (actor) {
            actor.setNickname(this._params[1]);
        }
        return true;
    }

    // Change Profile
    command325() {
        var actor = managers.State.$gameActors.actor(this._params[0]);
        if (actor) {
            actor.setProfile(this._params[1]);
        }
        return true;
    }

    // Change Enemy HP
    command331() {
        var value = this.operateValue(this._params[1], this._params[2], this._params[3]);
        this.iterateEnemyIndex(this._params[0], function(enemy) {
            this.changeHp(enemy, value, this._params[4]);
        }.bind(this));
        return true;
    }

    // Change Enemy MP
    command332() {
        var value = this.operateValue(this._params[1], this._params[2], this._params[3]);
        this.iterateEnemyIndex(this._params[0], function(enemy) {
            enemy.gainMp(value);
        }.bind(this));
        return true;
    }

    // Change Enemy TP
    command342() {
        var value = this.operateValue(this._params[1], this._params[2], this._params[3]);
        this.iterateEnemyIndex(this._params[0], function(enemy) {
            enemy.gainTp(value);
        }.bind(this));
        return true;
    }

    // Change Enemy State
    command333() {
        this.iterateEnemyIndex(this._params[0], function(enemy) {
            var alreadyDead = enemy.isDead();
            if (this._params[1] === 0) {
                enemy.addState(this._params[2]);
            } else {
                enemy.removeState(this._params[2]);
            }
            if (enemy.isDead() && !alreadyDead) {
                enemy.performCollapse();
            }
            enemy.clearResult();
        }.bind(this));
        return true;
    }

    // Enemy Recover All
    command334() {
        this.iterateEnemyIndex(this._params[0], function(enemy) {
            enemy.recoverAll();
        }.bind(this));
        return true;
    }

    // Enemy Appear
    command335() {
        this.iterateEnemyIndex(this._params[0], function(enemy) {
            enemy.appear();
            managers.State.$gameTroop.makeUniqueNames();
        }.bind(this));
        return true;
    }

    // Enemy Transform
    command336() {
        this.iterateEnemyIndex(this._params[0], function(enemy) {
            enemy.transform(this._params[1]);
            managers.State.$gameTroop.makeUniqueNames();
        }.bind(this));
        return true;
    }

    // Show Battle Animation
    command337() {
        if (this._params[2] == true) {
            this.iterateEnemyIndex(-1,function(enemy) {
                if (enemy.isAlive()) {
                    enemy.startAnimation(this._params[1],false,0);
                }
            }.bind(this));
        } else {
            this.iterateEnemyIndex(this._params[0], function (enemy) {
                if (enemy.isAlive()) {
                    enemy.startAnimation(this._params[1], false, 0);
                }
            }.bind(this));
        }
        return true;
    }

    // Force Action
    command339() {
        this.iterateBattler(this._params[0], this._params[1], function(battler) {
            if (!battler.isDeathStateAffected()) {
                battler.forceAction(this._params[2], this._params[3]);
                managers.BattleManager.forceAction(battler);
                this.setWaitMode('action');
            }
        }.bind(this));
        return true;
    }

    // Abort Battle
    command340() {
        managers.BattleManager.abort();
        return true;
    }

    // Open Menu Screen
    command351() {
        if (!managers.State.$gameParty.inBattle()) {
            managers.SceneManager.push(scenes.Menu);
            windows.MenuCommand.initCommandPosition();
        }
        return true;
    }

    // Open Save Screen
    command352() {
        if (!managers.State.$gameParty.inBattle()) {
            managers.SceneManager.push(scenes.Save);
        }
        return true;
    }

    // Game Over
    command353() {
        managers.SceneManager.goto(scenes.Gameover);
        return true;
    }

    // Return to Title Screen
    command354() {
        managers.SceneManager.goto(scenes.Title);
        return true;
    }

    // Script
    command355() {
        const {$dataActors, $dataClasses, $dataSkills, $dataItems, $dataWeapons, $dataArmors, $dataEnemies, $dataTroops, $dataStates, $dataAnimations, $dataTilesets, $dataCommonEvents, $dataSystem, $dataMapInfos, $dataMap, $gameTemp, $gameSystem, $gameScreen, $gameTimer, $gameMessage, $gameSwitches, $gameVariables, $gameSelfSwitches, $gameActors, $gameParty, $gameTroop, $gameMap, $gamePlayer, $testEvent} = managers.State;
        var startLine = this._index + 1;
        var script = this.currentCommand().parameters[0] + '\n';
        while (this.nextEventCode() === 655) {
            this._index++;
            script += this.currentCommand().parameters[0] + '\n';
        }
        var endLine = this._index + 1;
        try {
            eval(script);
        } catch (error) {
            error.line = startLine + "-" + endLine;
            error.eventCommand = "script";
            error.content = script;
            throw error;
        }
        return true;
    }

    // Plugin Command
    command356() {
        var args = this._params[0].split(" ");
        var command = args.shift();
        try {
            this.pluginCommand(command, args);
        } catch (error) {
            error.eventCommand = "plugin_command";
            error.content = this._params[0];
            throw error;
        }
        return true;
    }

    pluginCommand(command, args) {
        // to be overridden by plugins
    }

    static requestImagesByPluginCommand(command, args) {
    }

    static requestImagesForCommand(command) {
        var params = command.parameters;
        switch(command.code){
            // Show Text
            case 101:
                managers.ImageManager.requestFace(params[0]);
                break;

            // Change Party Member
            case 129:
                var actor = managers.State.$gameActors.actor(params[0]);
                if (actor && params[1] === 0) {
                    var name = actor.characterName();
                    managers.ImageManager.requestCharacter(name);
                }
                break;

            // Set Movement Route
            case 205:
                if(params[1]){
                    params[1].list.forEach(function(command){
                        var params = command.parameters;
                        if(command.code === objects.Character.ROUTE_CHANGE_IMAGE){
                            managers.ImageManager.requestCharacter(params[0]);
                        }
                    });
                }
                break;

            // Show Animation, Show Battle Animation
            case 212: case 337:
                if(params[1]) {
                    var animation = managers.State.$dataAnimations[params[1]];
                    var name1 = animation.animation1Name;
                    var name2 = animation.animation2Name;
                    var hue1 = animation.animation1Hue;
                    var hue2 = animation.animation2Hue;
                    managers.ImageManager.requestAnimation(name1, hue1);
                    managers.ImageManager.requestAnimation(name2, hue2);
                }
                break;

            // Change Player Followers
            case 216:
                if (params[0] === 0) {
                    managers.State.$gamePlayer.followers().forEach(function(follower) {
                        var name = follower.characterName();
                        managers.ImageManager.requestCharacter(name);
                    });
                }
                break;

            // Show Picture
            case 231:
                managers.ImageManager.requestPicture(params[1]);
                break;

            // Change Tileset
            case 282:
                var tileset = managers.State.$dataTilesets[params[0]];
                tileset.tilesetNames.forEach(function(tilesetName){
                    managers.ImageManager.requestTileset(tilesetName);
                });
                break;

            // Change Battle Back
            case 283:
                if (managers.State.$gameParty.inBattle()) {
                    managers.ImageManager.requestBattleback1(params[0]);
                    managers.ImageManager.requestBattleback2(params[1]);
                }
                break;

            // Change Parallax
            case 284:
                if (!managers.State.$gameParty.inBattle()) {
                    managers.ImageManager.requestParallax(params[0]);
                }
                break;

            // Change Actor Images
            case 322:
                managers.ImageManager.requestCharacter(params[1]);
                managers.ImageManager.requestFace(params[3]);
                managers.ImageManager.requestSvActor(params[5]);
                break;

            // Change Vehicle Image
            case 323:
                var vehicle = managers.State.$gameMap.vehicle(params[0]);
                if(vehicle){
                    managers.ImageManager.requestCharacter(params[1]);
                }
                break;

            // Enemy Transform
            case 336:
                var enemy = managers.State.$dataEnemies[params[1]];
                var name = enemy.battlerName;
                var hue = enemy.battlerHue;
                if (managers.State.$gameSystem.isSideView()) {
                    managers.ImageManager.requestSvEnemy(name, hue);
                } else {
                    managers.ImageManager.requestEnemy(name, hue);
                }
                break;
            // Plugin Command
            case 356:
                var args = params[0].split(" ");
                var commandName = args.shift();
                Interpreter.requestImagesByPluginCommand(commandName,args);
            break;

        }
    }

    static requestImagesByChildEvent(command, commonList) {
        var params =command.parameters;
        var commonEvent = managers.State.$dataCommonEvents[params[0]];
        if (commonEvent) {
            if (!commonList) {
                commonList = [];
            }
            if (!commonList.contains(params[0])) {
                commonList.push(params[0]);
                Interpreter.requestImages(commonEvent.list, commonList);
            }
        }
    }

    static requestImages(list, commonList) {
        if(!list){return;}
        var len = list.length;
        for(var i=0; i<len; i+=1 ){
            var command = list[i];
            // Common Event
            if(command.code ===117){
                Interpreter.requestImagesByChildEvent(command,commonList);
            }else{
                Interpreter.requestImagesForCommand(command);
            }
        }
    }
}

export {Interpreter};
