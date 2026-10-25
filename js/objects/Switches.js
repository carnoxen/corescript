import * as managers from '../managers/index.js';

//-----------------------------------------------------------------------------
// Switches
//
// The game object class for switches.
class Switches {
    constructor(...args) { this.initialize(...args); }

    initialize() {
        this.clear();
    }

    clear() {
        this._data = [];
    }

    value(switchId) {
        return !!this._data[switchId];
    }

    setValue(switchId, value) {
        if (switchId > 0 && switchId < managers.State.$dataSystem.switches.length) {
            this._data[switchId] = value;
            this.onChange();
        }
    }

    onChange() {
        managers.State.$gameMap.requestRefresh();
    }
}

export {Switches};
