import * as managers from '../managers/index.js';
import * as objects from './index.js';

//-----------------------------------------------------------------------------
// Actors
//
// The wrapper class for an actor array.
class Actors {
    constructor(...args) { this.initialize(...args); }

    initialize() {
        this._data = [];
    }

    actor(actorId) {
        if (managers.State.$dataActors[actorId]) {
            if (!this._data[actorId]) {
                this._data[actorId] = new objects.Actor(actorId);
            }
            return this._data[actorId];
        }
        return null;
    }
}

export {Actors};
