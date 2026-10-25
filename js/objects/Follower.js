import * as managers from '../managers/index.js';
import * as objects from './index.js';

//-----------------------------------------------------------------------------
// Follower
//
// The game object class for a follower. A follower is an allied character,
// other than the front character, displayed in the party.
class Follower extends objects.Character {
    initialize(memberIndex) {
        super.initialize();
        this._memberIndex = memberIndex;
        this.setTransparent(managers.State.$dataSystem.optTransparent);
        this.setThrough(true);
    }

    refresh() {
        var characterName = this.isVisible() ? this.actor().characterName() : '';
        var characterIndex = this.isVisible() ? this.actor().characterIndex() : 0;
        this.setImage(characterName, characterIndex);
    }

    actor() {
        return managers.State.$gameParty.battleMembers()[this._memberIndex];
    }

    isVisible() {
        return this.actor() && managers.State.$gamePlayer.followers().isVisible();
    }

    update() {
        super.update();
        this.setMoveSpeed(managers.State.$gamePlayer.realMoveSpeed());
        this.setOpacity(managers.State.$gamePlayer.opacity());
        this.setBlendMode(managers.State.$gamePlayer.blendMode());
        this.setWalkAnime(managers.State.$gamePlayer.hasWalkAnime());
        this.setStepAnime(managers.State.$gamePlayer.hasStepAnime());
        this.setDirectionFix(managers.State.$gamePlayer.isDirectionFixed());
        this.setTransparent(managers.State.$gamePlayer.isTransparent());
    }

    chaseCharacter(character) {
        var sx = this.deltaXFrom(character.x);
        var sy = this.deltaYFrom(character.y);
        if (sx !== 0 && sy !== 0) {
            this.moveDiagonally(sx > 0 ? 4 : 6, sy > 0 ? 8 : 2);
        } else if (sx !== 0) {
            this.moveStraight(sx > 0 ? 4 : 6);
        } else if (sy !== 0) {
            this.moveStraight(sy > 0 ? 8 : 2);
        }
        this.setMoveSpeed(managers.State.$gamePlayer.realMoveSpeed());
    }
}

export {Follower};
