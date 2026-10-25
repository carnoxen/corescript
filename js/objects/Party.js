import * as managers from '../managers/index.js';
import * as objects from './index.js';

//-----------------------------------------------------------------------------
// Party
//
// The game object class for the party. Information such as gold and items is
// included.
class Party extends objects.Unit {
    static ABILITY_ENCOUNTER_HALF = 0;

    static ABILITY_ENCOUNTER_NONE = 1;

    static ABILITY_CANCEL_SURPRISE = 2;

    static ABILITY_RAISE_PREEMPTIVE = 3;

    static ABILITY_GOLD_DOUBLE = 4;

    static ABILITY_DROP_ITEM_DOUBLE = 5;

    initialize() {
        super.initialize();
        this._gold = 0;
        this._steps = 0;
        this._lastItem = new objects.Item();
        this._menuActorId = 0;
        this._targetActorId = 0;
        this._actors = [];
        this.initAllItems();
    }

    initAllItems() {
        this._items = {};
        this._weapons = {};
        this._armors = {};
    }

    exists() {
        return this._actors.length > 0;
    }

    size() {
        return this.members().length;
    }

    isEmpty() {
        return this.size() === 0;
    }

    members() {
        return this.inBattle() ? this.battleMembers() : this.allMembers();
    }

    allMembers() {
        return this._actors.map(function(id) {
            return managers.State.$gameActors.actor(id);
        });
    }

    battleMembers() {
        return this.allMembers().slice(0, this.maxBattleMembers()).filter(function(actor) {
            return actor.isAppeared();
        });
    }

    maxBattleMembers() {
        return 4;
    }

    leader() {
        return this.battleMembers()[0];
    }

    reviveBattleMembers() {
        this.battleMembers().forEach(function(actor) {
            if (actor.isDead()) {
                actor.setHp(1);
            }
        });
    }

    items() {
        var list = [];
        for (var id in this._items) {
            list.push(managers.State.$dataItems[id]);
        }
        return list;
    }

    weapons() {
        var list = [];
        for (var id in this._weapons) {
            list.push(managers.State.$dataWeapons[id]);
        }
        return list;
    }

    armors() {
        var list = [];
        for (var id in this._armors) {
            list.push(managers.State.$dataArmors[id]);
        }
        return list;
    }

    equipItems() {
        return this.weapons().concat(this.armors());
    }

    allItems() {
        return this.items().concat(this.equipItems());
    }

    itemContainer(item) {
        if (!item) {
            return null;
        } else if (managers.DataManager.isItem(item)) {
            return this._items;
        } else if (managers.DataManager.isWeapon(item)) {
            return this._weapons;
        } else if (managers.DataManager.isArmor(item)) {
            return this._armors;
        } else {
            return null;
        }
    }

    setupStartingMembers() {
        this._actors = [];
        managers.State.$dataSystem.partyMembers.forEach(function(actorId) {
            if (managers.State.$gameActors.actor(actorId)) {
                this._actors.push(actorId);
            }
        }, this);
    }

    name() {
        var numBattleMembers = this.battleMembers().length;
        if (numBattleMembers === 0) {
            return '';
        } else if (numBattleMembers === 1) {
            return this.leader().name();
        } else {
            return managers.TextManager.partyName.format(this.leader().name());
        }
    }

    setupBattleTest() {
        this.setupBattleTestMembers();
        this.setupBattleTestItems();
    }

    setupBattleTestMembers() {
        managers.State.$dataSystem.testBattlers.forEach(function(battler) {
            var actor = managers.State.$gameActors.actor(battler.actorId);
            if (actor) {
                actor.changeLevel(battler.level, false);
                actor.initEquips(battler.equips);
                actor.recoverAll();
                this.addActor(battler.actorId);
            }
        }, this);
    }

    setupBattleTestItems() {
        managers.State.$dataItems.forEach(function(item) {
            if (item && item.name.length > 0) {
                this.gainItem(item, this.maxItems(item));
            }
        }, this);
    }

    highestLevel() {
        return Math.max.apply(null, this.members().map(function(actor) {
            return actor.level;
        }));
    }

    addActor(actorId) {
        if (!this._actors.contains(actorId)) {
            this._actors.push(actorId);
            managers.State.$gamePlayer.refresh();
            managers.State.$gameMap.requestRefresh();
        }
    }

    removeActor(actorId) {
        if (this._actors.contains(actorId)) {
            this._actors.splice(this._actors.indexOf(actorId), 1);
            managers.State.$gamePlayer.refresh();
            managers.State.$gameMap.requestRefresh();
        }
    }

    gold() {
        return this._gold;
    }

    gainGold(amount) {
        this._gold = (this._gold + amount).clamp(0, this.maxGold());
    }

    loseGold(amount) {
        this.gainGold(-amount);
    }

    maxGold() {
        return 99999999;
    }

    steps() {
        return this._steps;
    }

    increaseSteps() {
        this._steps++;
    }

    numItems(item) {
        var container = this.itemContainer(item);
        return container ? container[item.id] || 0 : 0;
    }

    maxItems(item) {
        return 99;
    }

    hasMaxItems(item) {
        return this.numItems(item) >= this.maxItems(item);
    }

    hasItem(item, includeEquip) {
        if (includeEquip === undefined) {
            includeEquip = false;
        }
        if (this.numItems(item) > 0) {
            return true;
        } else if (includeEquip && this.isAnyMemberEquipped(item)) {
            return true;
        } else {
            return false;
        }
    }

    isAnyMemberEquipped(item) {
        return this.members().some(function(actor) {
            return actor.equips().contains(item);
        });
    }

    gainItem(item, amount, includeEquip) {
        var container = this.itemContainer(item);
        if (container) {
            var lastNumber = this.numItems(item);
            var newNumber = lastNumber + amount;
            container[item.id] = newNumber.clamp(0, this.maxItems(item));
            if (container[item.id] === 0) {
                delete container[item.id];
            }
            if (includeEquip && newNumber < 0) {
                this.discardMembersEquip(item, -newNumber);
            }
            managers.State.$gameMap.requestRefresh();
        }
    }

    discardMembersEquip(item, amount) {
        var n = amount;
        this.members().forEach(function(actor) {
            while (n > 0 && actor.isEquipped(item)) {
                actor.discardEquip(item);
                n--;
            }
        });
    }

    loseItem(item, amount, includeEquip) {
        this.gainItem(item, -amount, includeEquip);
    }

    consumeItem(item) {
        if (managers.DataManager.isItem(item) && item.consumable) {
            this.loseItem(item, 1);
        }
    }

    canUse(item) {
        return this.members().some(function(actor) {
            return actor.canUse(item);
        });
    }

    canInput() {
        return this.members().some(function(actor) {
            return actor.canInput();
        });
    }

    isAllDead() {
        if (super.isAllDead()) {
            return this.inBattle() || !this.isEmpty();
        } else {
            return false;
        }
    }

    onPlayerWalk() {
        this.members().forEach(function(actor) {
            return actor.onPlayerWalk();
        });
    }

    menuActor() {
        var actor = managers.State.$gameActors.actor(this._menuActorId);
        if (!this.members().contains(actor)) {
            actor = this.members()[0];
        }
        return actor;
    }

    setMenuActor(actor) {
        this._menuActorId = actor.actorId();
    }

    makeMenuActorNext() {
        var index = this.members().indexOf(this.menuActor());
        if (index >= 0) {
            index = (index + 1) % this.members().length;
            this.setMenuActor(this.members()[index]);
        } else {
            this.setMenuActor(this.members()[0]);
        }
    }

    makeMenuActorPrevious() {
        var index = this.members().indexOf(this.menuActor());
        if (index >= 0) {
            index = (index + this.members().length - 1) % this.members().length;
            this.setMenuActor(this.members()[index]);
        } else {
            this.setMenuActor(this.members()[0]);
        }
    }

    targetActor() {
        var actor = managers.State.$gameActors.actor(this._targetActorId);
        if (!this.members().contains(actor)) {
            actor = this.members()[0];
        }
        return actor;
    }

    setTargetActor(actor) {
        this._targetActorId = actor.actorId();
    }

    lastItem() {
        return this._lastItem.object();
    }

    setLastItem(item) {
        this._lastItem.setObject(item);
    }

    swapOrder(index1, index2) {
        var temp = this._actors[index1];
        this._actors[index1] = this._actors[index2];
        this._actors[index2] = temp;
        managers.State.$gamePlayer.refresh();
    }

    charactersForSavefile() {
        return this.battleMembers().map(function(actor) {
            return [actor.characterName(), actor.characterIndex()];
        });
    }

    facesForSavefile() {
        return this.battleMembers().map(function(actor) {
            return [actor.faceName(), actor.faceIndex()];
        });
    }

    partyAbility(abilityId) {
        return this.battleMembers().some(function(actor) {
            return actor.partyAbility(abilityId);
        });
    }

    hasEncounterHalf() {
        return this.partyAbility(Party.ABILITY_ENCOUNTER_HALF);
    }

    hasEncounterNone() {
        return this.partyAbility(Party.ABILITY_ENCOUNTER_NONE);
    }

    hasCancelSurprise() {
        return this.partyAbility(Party.ABILITY_CANCEL_SURPRISE);
    }

    hasRaisePreemptive() {
        return this.partyAbility(Party.ABILITY_RAISE_PREEMPTIVE);
    }

    hasGoldDouble() {
        return this.partyAbility(Party.ABILITY_GOLD_DOUBLE);
    }

    hasDropItemDouble() {
        return this.partyAbility(Party.ABILITY_DROP_ITEM_DOUBLE);
    }

    ratePreemptive(troopAgi) {
        var rate = this.agility() >= troopAgi ? 0.05 : 0.03;
        if (this.hasRaisePreemptive()) {
            rate *= 4;
        }
        return rate;
    }

    rateSurprise(troopAgi) {
        var rate = this.agility() >= troopAgi ? 0.03 : 0.05;
        if (this.hasCancelSurprise()) {
            rate = 0;
        }
        return rate;
    }

    performVictory() {
        this.members().forEach(function(actor) {
            actor.performVictory();
        });
    }

    performEscape() {
        this.members().forEach(function(actor) {
            actor.performEscape();
        });
    }

    removeBattleStates() {
        this.members().forEach(function(actor) {
            actor.removeBattleStates();
        });
    }

    requestMotionRefresh() {
        this.members().forEach(function(actor) {
            actor.requestMotionRefresh();
        });
    }
}

export {Party};
