import * as managers from './index.js';

//-----------------------------------------------------------------------------
// TextManager
//
// The static class that handles terms and messages.
const TextManager = {
    basic(basicId) {
        return managers.State.$dataSystem.terms.basic[basicId] || '';
    },

    param(paramId) {
        return managers.State.$dataSystem.terms.params[paramId] || '';
    },

    command(commandId) {
        return managers.State.$dataSystem.terms.commands[commandId] || '';
    },

    message(messageId) {
        return managers.State.$dataSystem.terms.messages[messageId] || '';
    },

    getter(method, param) {
        return {
            get: function() {
                return this[method](param);
            },
            configurable: true
        };
    },

    get currencyUnit() { return managers.State.$dataSystem.currencyUnit; },

    get level() { return this['basic'](0); },

    get levelA() { return this['basic'](1); },

    get hp() { return this['basic'](2); },

    get hpA() { return this['basic'](3); },

    get mp() { return this['basic'](4); },

    get mpA() { return this['basic'](5); },

    get tp() { return this['basic'](6); },

    get tpA() { return this['basic'](7); },

    get exp() { return this['basic'](8); },

    get expA() { return this['basic'](9); },

    get fight() { return this['command'](0); },

    get escape() { return this['command'](1); },

    get attack() { return this['command'](2); },

    get guard() { return this['command'](3); },

    get item() { return this['command'](4); },

    get skill() { return this['command'](5); },

    get equip() { return this['command'](6); },

    get status() { return this['command'](7); },

    get formation() { return this['command'](8); },

    get save() { return this['command'](9); },

    get gameEnd() { return this['command'](10); },

    get options() { return this['command'](11); },

    get weapon() { return this['command'](12); },

    get armor() { return this['command'](13); },

    get keyItem() { return this['command'](14); },

    get equip2() { return this['command'](15); },

    get optimize() { return this['command'](16); },

    get clear() { return this['command'](17); },

    get newGame() { return this['command'](18); },

    get continue_() { return this['command'](19); },

    get toTitle() { return this['command'](21); },

    get cancel() { return this['command'](22); },

    get buy() { return this['command'](24); },

    get sell() { return this['command'](25); },

    get alwaysDash() { return this['message']('alwaysDash'); },

    get commandRemember() { return this['message']('commandRemember'); },

    get bgmVolume() { return this['message']('bgmVolume'); },

    get bgsVolume() { return this['message']('bgsVolume'); },

    get meVolume() { return this['message']('meVolume'); },

    get seVolume() { return this['message']('seVolume'); },

    get possession() { return this['message']('possession'); },

    get expTotal() { return this['message']('expTotal'); },

    get expNext() { return this['message']('expNext'); },

    get saveMessage() { return this['message']('saveMessage'); },

    get loadMessage() { return this['message']('loadMessage'); },

    get file() { return this['message']('file'); },

    get partyName() { return this['message']('partyName'); },

    get emerge() { return this['message']('emerge'); },

    get preemptive() { return this['message']('preemptive'); },

    get surprise() { return this['message']('surprise'); },

    get escapeStart() { return this['message']('escapeStart'); },

    get escapeFailure() { return this['message']('escapeFailure'); },

    get victory() { return this['message']('victory'); },

    get defeat() { return this['message']('defeat'); },

    get obtainExp() { return this['message']('obtainExp'); },

    get obtainGold() { return this['message']('obtainGold'); },

    get obtainItem() { return this['message']('obtainItem'); },

    get levelUp() { return this['message']('levelUp'); },

    get obtainSkill() { return this['message']('obtainSkill'); },

    get useItem() { return this['message']('useItem'); },

    get criticalToEnemy() { return this['message']('criticalToEnemy'); },

    get criticalToActor() { return this['message']('criticalToActor'); },

    get actorDamage() { return this['message']('actorDamage'); },

    get actorRecovery() { return this['message']('actorRecovery'); },

    get actorGain() { return this['message']('actorGain'); },

    get actorLoss() { return this['message']('actorLoss'); },

    get actorDrain() { return this['message']('actorDrain'); },

    get actorNoDamage() { return this['message']('actorNoDamage'); },

    get actorNoHit() { return this['message']('actorNoHit'); },

    get enemyDamage() { return this['message']('enemyDamage'); },

    get enemyRecovery() { return this['message']('enemyRecovery'); },

    get enemyGain() { return this['message']('enemyGain'); },

    get enemyLoss() { return this['message']('enemyLoss'); },

    get enemyDrain() { return this['message']('enemyDrain'); },

    get enemyNoDamage() { return this['message']('enemyNoDamage'); },

    get enemyNoHit() { return this['message']('enemyNoHit'); },

    get evasion() { return this['message']('evasion'); },

    get magicEvasion() { return this['message']('magicEvasion'); },

    get magicReflection() { return this['message']('magicReflection'); },

    get counterAttack() { return this['message']('counterAttack'); },

    get substitute() { return this['message']('substitute'); },

    get buffAdd() { return this['message']('buffAdd'); },

    get debuffAdd() { return this['message']('debuffAdd'); },

    get buffRemove() { return this['message']('buffRemove'); },

    get actionFailure() { return this['message']('actionFailure'); },
};

export {TextManager};
