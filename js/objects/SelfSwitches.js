import * as managers from '../managers/index.js';

//-----------------------------------------------------------------------------
// SelfSwitches
//
// The game object class for self switches.
class SelfSwitches {
    constructor(...args) { this.initialize(...args); }

    initialize() {
        this.clear();
    }

    clear() {
        this._data = {};
    }

    value(key) {
        return !!this._data[key];
    }

    setValue(key, value) {
        if (value) {
            this._data[key] = true;
        } else {
            delete this._data[key];
        }
        this.onChange();
    }

    onChange() {
        managers.State.$gameMap.requestRefresh();
    }
}

export {SelfSwitches};
