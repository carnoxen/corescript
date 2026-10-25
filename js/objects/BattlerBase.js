import * as managers from '../managers/index.js';

//-----------------------------------------------------------------------------
// BattlerBase
//
// The superclass of objects.Battler. It mainly contains parameters calculation.
class BattlerBase {
    constructor(...args) { this.initialize(...args); }

    static TRAIT_ELEMENT_RATE = 11;

    static TRAIT_DEBUFF_RATE = 12;

    static TRAIT_STATE_RATE = 13;

    static TRAIT_STATE_RESIST = 14;

    static TRAIT_PARAM = 21;

    static TRAIT_XPARAM = 22;

    static TRAIT_SPARAM = 23;

    static TRAIT_ATTACK_ELEMENT = 31;

    static TRAIT_ATTACK_STATE = 32;

    static TRAIT_ATTACK_SPEED = 33;

    static TRAIT_ATTACK_TIMES = 34;

    static TRAIT_STYPE_ADD = 41;

    static TRAIT_STYPE_SEAL = 42;

    static TRAIT_SKILL_ADD = 43;

    static TRAIT_SKILL_SEAL = 44;

    static TRAIT_EQUIP_WTYPE = 51;

    static TRAIT_EQUIP_ATYPE = 52;

    static TRAIT_EQUIP_LOCK = 53;

    static TRAIT_EQUIP_SEAL = 54;

    static TRAIT_SLOT_TYPE = 55;

    static TRAIT_ACTION_PLUS = 61;

    static TRAIT_SPECIAL_FLAG = 62;

    static TRAIT_COLLAPSE_TYPE = 63;

    static TRAIT_PARTY_ABILITY = 64;

    static FLAG_ID_AUTO_BATTLE = 0;

    static FLAG_ID_GUARD = 1;

    static FLAG_ID_SUBSTITUTE = 2;

    static FLAG_ID_PRESERVE_TP = 3;

    static ICON_BUFF_START = 32;

    static ICON_DEBUFF_START = 48;

    get hp() { return this._hp; }

    get mp() { return this._mp; }

    get tp() { return this._tp; }

    get mhp() { return this.param(0); }

    get mmp() { return this.param(1); }

    get atk() { return this.param(2); }

    get def() { return this.param(3); }

    get mat() { return this.param(4); }

    get mdf() { return this.param(5); }

    get agi() { return this.param(6); }

    get luk() { return this.param(7); }

    get hit() { return this.xparam(0); }

    get eva() { return this.xparam(1); }

    get cri() { return this.xparam(2); }

    get cev() { return this.xparam(3); }

    get mev() { return this.xparam(4); }

    get mrf() { return this.xparam(5); }

    get cnt() { return this.xparam(6); }

    get hrg() { return this.xparam(7); }

    get mrg() { return this.xparam(8); }

    get trg() { return this.xparam(9); }

    get tgr() { return this.sparam(0); }

    get grd() { return this.sparam(1); }

    get rec() { return this.sparam(2); }

    get pha() { return this.sparam(3); }

    get mcr() { return this.sparam(4); }

    get tcr() { return this.sparam(5); }

    get pdr() { return this.sparam(6); }

    get mdr() { return this.sparam(7); }

    get fdr() { return this.sparam(8); }

    get exr() { return this.sparam(9); }

    initialize() {
        this.initMembers();
    }

    initMembers() {
        this._hp = 1;
        this._mp = 0;
        this._tp = 0;
        this._hidden = false;
        this.clearParamPlus();
        this.clearStates();
        this.clearBuffs();
    }

    clearParamPlus() {
        this._paramPlus = [0,0,0,0,0,0,0,0];
    }

    clearStates() {
        this._states = [];
        this._stateTurns = {};
    }

    eraseState(stateId) {
        var index = this._states.indexOf(stateId);
        if (index >= 0) {
            this._states.splice(index, 1);
        }
        delete this._stateTurns[stateId];
    }

    isStateAffected(stateId) {
        return this._states.contains(stateId);
    }

    isDeathStateAffected() {
        return this.isStateAffected(this.deathStateId());
    }

    deathStateId() {
        return 1;
    }

    resetStateCounts(stateId) {
        var state = managers.State.$dataStates[stateId];
        var variance = 1 + Math.max(state.maxTurns - state.minTurns, 0);
        this._stateTurns[stateId] = state.minTurns + Math.randomInt(variance);
    }

    isStateExpired(stateId) {
        return this._stateTurns[stateId] === 0;
    }

    updateStateTurns() {
        this._states.forEach(function(stateId) {
            if (this._stateTurns[stateId] > 0) {
                this._stateTurns[stateId]--;
            }
        }, this);
    }

    clearBuffs() {
        this._buffs = [0,0,0,0,0,0,0,0];
        this._buffTurns = [0,0,0,0,0,0,0,0];
    }

    eraseBuff(paramId) {
        this._buffs[paramId] = 0;
        this._buffTurns[paramId] = 0;
    }

    buffLength() {
        return this._buffs.length;
    }

    buff(paramId) {
        return this._buffs[paramId];
    }

    isBuffAffected(paramId) {
        return this._buffs[paramId] > 0;
    }

    isDebuffAffected(paramId) {
        return this._buffs[paramId] < 0;
    }

    isBuffOrDebuffAffected(paramId) {
        return this._buffs[paramId] !== 0;
    }

    isMaxBuffAffected(paramId) {
        return this._buffs[paramId] === 2;
    }

    isMaxDebuffAffected(paramId) {
        return this._buffs[paramId] === -2;
    }

    increaseBuff(paramId) {
        if (!this.isMaxBuffAffected(paramId)) {
            this._buffs[paramId]++;
        }
    }

    decreaseBuff(paramId) {
        if (!this.isMaxDebuffAffected(paramId)) {
            this._buffs[paramId]--;
        }
    }

    overwriteBuffTurns(paramId, turns) {
        if (this._buffTurns[paramId] < turns) {
            this._buffTurns[paramId] = turns;
        }
    }

    isBuffExpired(paramId) {
        return this._buffTurns[paramId] === 0;
    }

    updateBuffTurns() {
        for (var i = 0; i < this._buffTurns.length; i++) {
            if (this._buffTurns[i] > 0) {
                this._buffTurns[i]--;
            }
        }
    }

    die() {
        this._hp = 0;
        this.clearStates();
        this.clearBuffs();
    }

    revive() {
        if (this._hp === 0) {
            this._hp = 1;
        }
    }

    states() {
        return this._states.map(function(id) {
            return managers.State.$dataStates[id];
        });
    }

    stateIcons() {
        return this.states().map(function(state) {
            return state.iconIndex;
        }).filter(function(iconIndex) {
            return iconIndex > 0;
        });
    }

    buffIcons() {
        var icons = [];
        for (var i = 0; i < this._buffs.length; i++) {
            if (this._buffs[i] !== 0) {
                icons.push(this.buffIconIndex(this._buffs[i], i));
            }
        }
        return icons;
    }

    buffIconIndex(buffLevel, paramId) {
        if (buffLevel > 0) {
            return BattlerBase.ICON_BUFF_START + (buffLevel - 1) * 8 + paramId;
        } else if (buffLevel < 0) {
            return BattlerBase.ICON_DEBUFF_START + (-buffLevel - 1) * 8 + paramId;
        } else {
            return 0;
        }
    }

    allIcons() {
        return this.stateIcons().concat(this.buffIcons());
    }

    traitObjects() {
        // Returns an array of the all objects having traits. States only here.
        return this.states();
    }

    allTraits() {
        return this.traitObjects().reduce(function(r, obj) {
            return r.concat(obj.traits);
        }, []);
    }

    traits(code) {
        return this.allTraits().filter(function(trait) {
            return trait.code === code;
        });
    }

    traitsWithId(code, id) {
        return this.allTraits().filter(function(trait) {
            return trait.code === code && trait.dataId === id;
        });
    }

    traitsPi(code, id) {
        return this.traitsWithId(code, id).reduce(function(r, trait) {
            return r * trait.value;
        }, 1);
    }

    traitsSum(code, id) {
        return this.traitsWithId(code, id).reduce(function(r, trait) {
            return r + trait.value;
        }, 0);
    }

    traitsSumAll(code) {
        return this.traits(code).reduce(function(r, trait) {
            return r + trait.value;
        }, 0);
    }

    traitsSet(code) {
        return this.traits(code).reduce(function(r, trait) {
            return r.concat(trait.dataId);
        }, []);
    }

    paramBase(paramId) {
        return 0;
    }

    paramPlus(paramId) {
        return this._paramPlus[paramId];
    }

    paramMin(paramId) {
        if (paramId === 1) {
            return 0;   // MMP
        } else {
            return 1;
        }
    }

    paramMax(paramId) {
        if (paramId === 0) {
            return 999999;  // MHP
        } else if (paramId === 1) {
            return 9999;    // MMP
        } else {
            return 999;
        }
    }

    paramRate(paramId) {
        return this.traitsPi(BattlerBase.TRAIT_PARAM, paramId);
    }

    paramBuffRate(paramId) {
        return this._buffs[paramId] * 0.25 + 1.0;
    }

    param(paramId) {
        var value = this.paramBase(paramId) + this.paramPlus(paramId);
        value *= this.paramRate(paramId) * this.paramBuffRate(paramId);
        var maxValue = this.paramMax(paramId);
        var minValue = this.paramMin(paramId);
        return Math.round(value.clamp(minValue, maxValue));
    }

    xparam(xparamId) {
        return this.traitsSum(BattlerBase.TRAIT_XPARAM, xparamId);
    }

    sparam(sparamId) {
        return this.traitsPi(BattlerBase.TRAIT_SPARAM, sparamId);
    }

    elementRate(elementId) {
        return this.traitsPi(BattlerBase.TRAIT_ELEMENT_RATE, elementId);
    }

    debuffRate(paramId) {
        return this.traitsPi(BattlerBase.TRAIT_DEBUFF_RATE, paramId);
    }

    stateRate(stateId) {
        return this.traitsPi(BattlerBase.TRAIT_STATE_RATE, stateId);
    }

    stateResistSet() {
        return this.traitsSet(BattlerBase.TRAIT_STATE_RESIST);
    }

    isStateResist(stateId) {
        return this.stateResistSet().contains(stateId);
    }

    attackElements() {
        return this.traitsSet(BattlerBase.TRAIT_ATTACK_ELEMENT);
    }

    attackStates() {
        return this.traitsSet(BattlerBase.TRAIT_ATTACK_STATE);
    }

    attackStatesRate(stateId) {
        return this.traitsSum(BattlerBase.TRAIT_ATTACK_STATE, stateId);
    }

    attackSpeed() {
        return this.traitsSumAll(BattlerBase.TRAIT_ATTACK_SPEED);
    }

    attackTimesAdd() {
        return Math.max(this.traitsSumAll(BattlerBase.TRAIT_ATTACK_TIMES), 0);
    }

    addedSkillTypes() {
        return this.traitsSet(BattlerBase.TRAIT_STYPE_ADD);
    }

    isSkillTypeSealed(stypeId) {
        return this.traitsSet(BattlerBase.TRAIT_STYPE_SEAL).contains(stypeId);
    }

    addedSkills() {
        return this.traitsSet(BattlerBase.TRAIT_SKILL_ADD);
    }

    isSkillSealed(skillId) {
        return this.traitsSet(BattlerBase.TRAIT_SKILL_SEAL).contains(skillId);
    }

    isEquipWtypeOk(wtypeId) {
        return this.traitsSet(BattlerBase.TRAIT_EQUIP_WTYPE).contains(wtypeId);
    }

    isEquipAtypeOk(atypeId) {
        return this.traitsSet(BattlerBase.TRAIT_EQUIP_ATYPE).contains(atypeId);
    }

    isEquipTypeLocked(etypeId) {
        return this.traitsSet(BattlerBase.TRAIT_EQUIP_LOCK).contains(etypeId);
    }

    isEquipTypeSealed(etypeId) {
        return this.traitsSet(BattlerBase.TRAIT_EQUIP_SEAL).contains(etypeId);
    }

    slotType() {
        var set = this.traitsSet(BattlerBase.TRAIT_SLOT_TYPE);
        return set.length > 0 ? Math.max.apply(null, set) : 0;
    }

    isDualWield() {
        return this.slotType() === 1;
    }

    actionPlusSet() {
        return this.traits(BattlerBase.TRAIT_ACTION_PLUS).map(function(trait) {
            return trait.value;
        });
    }

    specialFlag(flagId) {
        return this.traits(BattlerBase.TRAIT_SPECIAL_FLAG).some(function(trait) {
            return trait.dataId === flagId;
        });
    }

    collapseType() {
        var set = this.traitsSet(BattlerBase.TRAIT_COLLAPSE_TYPE);
        return set.length > 0 ? Math.max.apply(null, set) : 0;
    }

    partyAbility(abilityId) {
        return this.traits(BattlerBase.TRAIT_PARTY_ABILITY).some(function(trait) {
            return trait.dataId === abilityId;
        });
    }

    isAutoBattle() {
        return this.specialFlag(BattlerBase.FLAG_ID_AUTO_BATTLE);
    }

    isGuard() {
        return this.specialFlag(BattlerBase.FLAG_ID_GUARD) && this.canMove();
    }

    isSubstitute() {
        return this.specialFlag(BattlerBase.FLAG_ID_SUBSTITUTE) && this.canMove();
    }

    isPreserveTp() {
        return this.specialFlag(BattlerBase.FLAG_ID_PRESERVE_TP);
    }

    addParam(paramId, value) {
        this._paramPlus[paramId] += value;
        this.refresh();
    }

    setHp(hp) {
        this._hp = hp;
        this.refresh();
    }

    setMp(mp) {
        this._mp = mp;
        this.refresh();
    }

    setTp(tp) {
        this._tp = tp;
        this.refresh();
    }

    maxTp() {
        return 100;
    }

    refresh() {
        this.stateResistSet().forEach(function(stateId) {
            this.eraseState(stateId);
        }, this);
        this._hp = this._hp.clamp(0, this.mhp);
        this._mp = this._mp.clamp(0, this.mmp);
        this._tp = this._tp.clamp(0, this.maxTp());
    }

    recoverAll() {
        this.clearStates();
        this._hp = this.mhp;
        this._mp = this.mmp;
    }

    hpRate() {
        return this.hp / this.mhp;
    }

    mpRate() {
        return this.mmp > 0 ? this.mp / this.mmp : 0;
    }

    tpRate() {
        return this.tp / this.maxTp();
    }

    hide() {
        this._hidden = true;
    }

    appear() {
        this._hidden = false;
    }

    isHidden() {
        return this._hidden;
    }

    isAppeared() {
        return !this.isHidden();
    }

    isDead() {
        return this.isAppeared() && this.isDeathStateAffected();
    }

    isAlive() {
        return this.isAppeared() && !this.isDeathStateAffected();
    }

    isDying() {
        return this.isAlive() && this._hp < this.mhp / 4;
    }

    isRestricted() {
        return this.isAppeared() && this.restriction() > 0;
    }

    canInput() {
        return this.isAppeared() && !this.isRestricted() && !this.isAutoBattle();
    }

    canMove() {
        return this.isAppeared() && this.restriction() < 4;
    }

    isConfused() {
        return this.isAppeared() && this.restriction() >= 1 && this.restriction() <= 3;
    }

    confusionLevel() {
        return this.isConfused() ? this.restriction() : 0;
    }

    isActor() {
        return false;
    }

    isEnemy() {
        return false;
    }

    sortStates() {
        this._states.sort(function(a, b) {
            var p1 = managers.State.$dataStates[a].priority;
            var p2 = managers.State.$dataStates[b].priority;
            if (p1 !== p2) {
                return p2 - p1;
            }
            return a - b;
        });
    }

    restriction() {
        return Math.max.apply(null, this.states().map(function(state) {
            return state.restriction;
        }).concat(0));
    }

    addNewState(stateId) {
        if (stateId === this.deathStateId()) {
            this.die();
        }
        var restricted = this.isRestricted();
        this._states.push(stateId);
        this.sortStates();
        if (!restricted && this.isRestricted()) {
            this.onRestrict();
        }
    }

    onRestrict() {
    }

    mostImportantStateText() {
        var states = this.states();
        for (var i = 0; i < states.length; i++) {
            if (states[i].message3) {
                return states[i].message3;
            }
        }
        return '';
    }

    stateMotionIndex() {
        var states = this.states();
        if (states.length > 0) {
            return states[0].motion;
        } else {
            return 0;
        }
    }

    stateOverlayIndex() {
        var states = this.states();
        if (states.length > 0) {
            return states[0].overlay;
        } else {
            return 0;
        }
    }

    isSkillWtypeOk(skill) {
        return true;
    }

    skillMpCost(skill) {
        return Math.floor(skill.mpCost * this.mcr);
    }

    skillTpCost(skill) {
        return skill.tpCost;
    }

    canPaySkillCost(skill) {
        return this._tp >= this.skillTpCost(skill) && this._mp >= this.skillMpCost(skill);
    }

    paySkillCost(skill) {
        this._mp -= this.skillMpCost(skill);
        this._tp -= this.skillTpCost(skill);
    }

    isOccasionOk(item) {
        if (managers.State.$gameParty.inBattle()) {
            return item.occasion === 0 || item.occasion === 1;
        } else {
            return item.occasion === 0 || item.occasion === 2;
        }
    }

    meetsUsableItemConditions(item) {
        return this.canMove() && this.isOccasionOk(item);
    }

    meetsSkillConditions(skill) {
        return (this.meetsUsableItemConditions(skill) &&
                this.isSkillWtypeOk(skill) && this.canPaySkillCost(skill) &&
                !this.isSkillSealed(skill.id) && !this.isSkillTypeSealed(skill.stypeId));
    }

    meetsItemConditions(item) {
        return this.meetsUsableItemConditions(item) && managers.State.$gameParty.hasItem(item);
    }

    canUse(item) {
        if (!item) {
            return false;
        } else if (managers.DataManager.isSkill(item)) {
            return this.meetsSkillConditions(item);
        } else if (managers.DataManager.isItem(item)) {
            return this.meetsItemConditions(item);
        } else {
            return false;
        }
    }

    canEquip(item) {
        if (!item) {
            return false;
        } else if (managers.DataManager.isWeapon(item)) {
            return this.canEquipWeapon(item);
        } else if (managers.DataManager.isArmor(item)) {
            return this.canEquipArmor(item);
        } else {
            return false;
        }
    }

    canEquipWeapon(item) {
        return this.isEquipWtypeOk(item.wtypeId) && !this.isEquipTypeSealed(item.etypeId);
    }

    canEquipArmor(item) {
        return this.isEquipAtypeOk(item.atypeId) && !this.isEquipTypeSealed(item.etypeId);
    }

    attackSkillId() {
        return 1;
    }

    guardSkillId() {
        return 2;
    }

    canAttack() {
        return this.canUse(managers.State.$dataSkills[this.attackSkillId()]);
    }

    canGuard() {
        return this.canUse(managers.State.$dataSkills[this.guardSkillId()]);
    }
}

export {BattlerBase};
