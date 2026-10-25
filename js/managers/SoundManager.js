import * as managers from './index.js';

//-----------------------------------------------------------------------------
// SoundManager
//
// The static class that plays sound effects defined in the database.
const SoundManager = {
    preloadImportantSounds() {
        this.loadSystemSound(0);
        this.loadSystemSound(1);
        this.loadSystemSound(2);
        this.loadSystemSound(3);
    },

    loadSystemSound(n) {
        if (managers.State.$dataSystem) {
            managers.AudioManager.loadStaticSe(managers.State.$dataSystem.sounds[n]);
        }
    },

    playSystemSound(n) {
        if (managers.State.$dataSystem) {
            managers.AudioManager.playStaticSe(managers.State.$dataSystem.sounds[n]);
        }
    },

    playCursor() {
        this.playSystemSound(0);
    },

    playOk() {
        this.playSystemSound(1);
    },

    playCancel() {
        this.playSystemSound(2);
    },

    playBuzzer() {
        this.playSystemSound(3);
    },

    playEquip() {
        this.playSystemSound(4);
    },

    playSave() {
        this.playSystemSound(5);
    },

    playLoad() {
        this.playSystemSound(6);
    },

    playBattleStart() {
        this.playSystemSound(7);
    },

    playEscape() {
        this.playSystemSound(8);
    },

    playEnemyAttack() {
        this.playSystemSound(9);
    },

    playEnemyDamage() {
        this.playSystemSound(10);
    },

    playEnemyCollapse() {
        this.playSystemSound(11);
    },

    playBossCollapse1() {
        this.playSystemSound(12);
    },

    playBossCollapse2() {
        this.playSystemSound(13);
    },

    playActorDamage() {
        this.playSystemSound(14);
    },

    playActorCollapse() {
        this.playSystemSound(15);
    },

    playRecovery() {
        this.playSystemSound(16);
    },

    playMiss() {
        this.playSystemSound(17);
    },

    playEvasion() {
        this.playSystemSound(18);
    },

    playMagicEvasion() {
        this.playSystemSound(19);
    },

    playReflection() {
        this.playSystemSound(20);
    },

    playShop() {
        this.playSystemSound(21);
    },

    playUseItem() {
        this.playSystemSound(22);
    },

    playUseSkill() {
        this.playSystemSound(23);
    },
};

export {SoundManager};
