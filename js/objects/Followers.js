import * as managers from '../managers/index.js';
import * as objects from './index.js';

//-----------------------------------------------------------------------------
// Followers
//
// The wrapper class for a follower array.
class Followers {
    constructor(...args) { this.initialize(...args); }

    initialize() {
        this._visible = managers.State.$dataSystem.optFollowers;
        this._gathering = false;
        this._data = [];
        for (var i = 1; i < managers.State.$gameParty.maxBattleMembers(); i++) {
            this._data.push(new objects.Follower(i));
        }
    }

    isVisible() {
        return this._visible;
    }

    show() {
        this._visible = true;
    }

    hide() {
        this._visible = false;
    }

    follower(index) {
        return this._data[index];
    }

    forEach(callback, thisObject) {
        this._data.forEach(callback, thisObject);
    }

    reverseEach(callback, thisObject) {
        this._data.reverse();
        this._data.forEach(callback, thisObject);
        this._data.reverse();
    }

    refresh() {
        this.forEach(function(follower) {
            return follower.refresh();
        }, this);
    }

    update() {
        if (this.areGathering()) {
            if (!this.areMoving()) {
                this.updateMove();
            }
            if (this.areGathered()) {
                this._gathering = false;
            }
        }
        this.forEach(function(follower) {
            follower.update();
        }, this);
    }

    updateMove() {
        for (var i = this._data.length - 1; i >= 0; i--) {
            var precedingCharacter = (i > 0 ? this._data[i - 1] : managers.State.$gamePlayer);
            this._data[i].chaseCharacter(precedingCharacter);
        }
    }

    jumpAll() {
        if (managers.State.$gamePlayer.isJumping()) {
            for (var i = 0; i < this._data.length; i++) {
                var follower = this._data[i];
                var sx = managers.State.$gamePlayer.deltaXFrom(follower.x);
                var sy = managers.State.$gamePlayer.deltaYFrom(follower.y);
                follower.jump(sx, sy);
            }
        }
    }

    synchronize(x, y, d) {
        this.forEach(function(follower) {
            follower.locate(x, y);
            follower.setDirection(d);
        }, this);
    }

    gather() {
        this._gathering = true;
    }

    areGathering() {
        return this._gathering;
    }

    visibleFollowers() {
        return this._data.filter(function(follower) {
            return follower.isVisible();
        }, this);
    }

    areMoving() {
        return this.visibleFollowers().some(function(follower) {
            return follower.isMoving();
        }, this);
    }

    areGathered() {
        return this.visibleFollowers().every(function(follower) {
            return !follower.isMoving() && follower.pos(managers.State.$gamePlayer.x, managers.State.$gamePlayer.y);
        }, this);
    }

    isSomeoneCollided(x, y) {
        return this.visibleFollowers().some(function(follower) {
            return follower.pos(x, y);
        }, this);
    }
}

export {Followers};
