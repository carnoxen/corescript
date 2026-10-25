import * as managers from '../managers/index.js';

//-----------------------------------------------------------------------------
// Variables
//
// The game object class for variables.
class Variables {
    constructor(...args) { this.initialize(...args); }

    initialize() {
        this.clear();
    }

    clear() {
        this._data = [];
    }

    value(variableId) {
        return this._data[variableId] || 0;
    }

    setValue(variableId, value) {
        if (variableId > 0 && variableId < managers.State.$dataSystem.variables.length) {
            if (typeof value === 'number') {
                value = Math.floor(value);
            }
            this._data[variableId] = value;
            this.onChange();
        }
    }

    onChange() {
        managers.State.$gameMap.requestRefresh();
    }
}

export {Variables};
