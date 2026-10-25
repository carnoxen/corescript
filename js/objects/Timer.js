import * as managers from '../managers/index.js';

//-----------------------------------------------------------------------------
// Timer
//
// The game object class for the timer.
class Timer {
    constructor(...args) { this.initialize(...args); }

    initialize() {
        this._frames = 0;
        this._working = false;
    }

    update(sceneActive) {
        if (sceneActive && this._working && this._frames > 0) {
            this._frames--;
            if (this._frames === 0) {
                this.onExpire();
            }
        }
    }

    start(count) {
        this._frames = count;
        this._working = true;
    }

    stop() {
        this._working = false;
    }

    isWorking() {
        return this._working;
    }

    seconds() {
        return Math.floor(this._frames / 60);
    }

    onExpire() {
        managers.BattleManager.abort();
    }
}

export {Timer};
