import * as managers from '../managers/index.js';
import * as objects from './index.js';

//-----------------------------------------------------------------------------
// CommonEvent
//
// The game object class for a common event. It contains functionality for
// running parallel process events.
class CommonEvent {
    constructor(...args) { this.initialize(...args); }

    initialize(commonEventId) {
        this._commonEventId = commonEventId;
        this.refresh();
    }

    event() {
        return managers.State.$dataCommonEvents[this._commonEventId];
    }

    list() {
        return this.event().list;
    }

    refresh() {
        if (this.isActive()) {
            if (!this._interpreter) {
                this._interpreter = new objects.Interpreter();
            }
        } else {
            this._interpreter = null;
        }
    }

    isActive() {
        var event = this.event();
        return event.trigger === 2 && managers.State.$gameSwitches.value(event.switchId);
    }

    update() {
        if (this._interpreter) {
            if (!this._interpreter.isRunning()) {
                this._interpreter.setup(this.list());
                this._interpreter.setEventInfo({ eventType: 'common_event', commonEventId: this._commonEventId });
            }
            this._interpreter.update();
        }
    }
}

export {CommonEvent};
