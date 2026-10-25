import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as objects from './index.js';

//-----------------------------------------------------------------------------
// Player
//
// The game object class for the player. It contains event starting
// determinants and map scrolling functions.
class Player extends objects.Character {
    initialize() {
        super.initialize();
        this.setTransparent(managers.State.$dataSystem.optTransparent);
    }

    initMembers() {
        super.initMembers();
        this._vehicleType = 'walk';
        this._vehicleGettingOn = false;
        this._vehicleGettingOff = false;
        this._dashing = false;
        this._needsMapReload = false;
        this._transferring = false;
        this._newMapId = 0;
        this._newX = 0;
        this._newY = 0;
        this._newDirection = 0;
        this._fadeType = 0;
        this._followers = new objects.Followers();
        this._encounterCount = 0;
    }

    clearTransferInfo() {
        this._transferring = false;
        this._newMapId = 0;
        this._newX = 0;
        this._newY = 0;
        this._newDirection = 0;
    }

    followers() {
        return this._followers;
    }

    refresh() {
        var actor = managers.State.$gameParty.leader();
        var characterName = actor ? actor.characterName() : '';
        var characterIndex = actor ? actor.characterIndex() : 0;
        this.setImage(characterName, characterIndex);
        this._followers.refresh();
    }

    isStopping() {
        if (this._vehicleGettingOn || this._vehicleGettingOff) {
            return false;
        }
        return super.isStopping();
    }

    reserveTransfer(mapId, x, y, d, fadeType) {
        this._transferring = true;
        this._newMapId = mapId;
        this._newX = x;
        this._newY = y;
        this._newDirection = d;
        this._fadeType = fadeType;
    }

    requestMapReload() {
        this._needsMapReload = true;
    }

    isTransferring() {
        return this._transferring;
    }

    newMapId() {
        return this._newMapId;
    }

    fadeType() {
        return this._fadeType;
    }

    performTransfer() {
        if (this.isTransferring()) {
            this.setDirection(this._newDirection);
            if (this._newMapId !== managers.State.$gameMap.mapId() || this._needsMapReload) {
                managers.State.$gameMap.setup(this._newMapId);
                this._needsMapReload = false;
            }
            this.locate(this._newX, this._newY);
            this.refresh();
            managers.DataManager.autoSaveGame();
            this.clearTransferInfo();
        }
    }

    isMapPassable(x, y, d) {
        var vehicle = this.vehicle();
        if (vehicle) {
            return vehicle.isMapPassable(x, y, d);
        } else {
            return super.isMapPassable(x, y, d);
        }
    }

    vehicle() {
        return managers.State.$gameMap.vehicle(this._vehicleType);
    }

    isInBoat() {
        return this._vehicleType === 'boat';
    }

    isInShip() {
        return this._vehicleType === 'ship';
    }

    isInAirship() {
        return this._vehicleType === 'airship';
    }

    isInVehicle() {
        return this.isInBoat() || this.isInShip() || this.isInAirship();
    }

    isNormal() {
        return this._vehicleType === 'walk' && !this.isMoveRouteForcing();
    }

    isDashing() {
        return this._dashing;
    }

    isDebugThrough() {
        return core.Input.isPressed('control') && managers.State.$gameTemp.isPlaytest();
    }

    isCollided(x, y) {
        if (this.isThrough()) {
            return false;
        } else {
            return this.pos(x, y) || this._followers.isSomeoneCollided(x, y);
        }
    }

    centerX() {
        return (core.Graphics.width / managers.State.$gameMap.tileWidth() - 1) / 2.0;
    }

    centerY() {
        return (core.Graphics.height / managers.State.$gameMap.tileHeight() - 1) / 2.0;
    }

    center(x, y) {
        return managers.State.$gameMap.setDisplayPos(x - this.centerX(), y - this.centerY());
    }

    locate(x, y) {
        super.locate(x, y);
        this.center(x, y);
        this.makeEncounterCount();
        if (this.isInVehicle()) {
            this.vehicle().refresh();
        }
        this._followers.synchronize(x, y, this.direction());
    }

    increaseSteps() {
        super.increaseSteps();
        if (this.isNormal()) {
            managers.State.$gameParty.increaseSteps();
        }
    }

    makeEncounterCount() {
        var n = managers.State.$gameMap.encounterStep();
        this._encounterCount = Math.randomInt(n) + Math.randomInt(n) + 1;
    }

    makeEncounterTroopId() {
        var encounterList = [];
        var weightSum = 0;
        managers.State.$gameMap.encounterList().forEach(function(encounter) {
            if (this.meetsEncounterConditions(encounter)) {
                encounterList.push(encounter);
                weightSum += encounter.weight;
            }
        }, this);
        if (weightSum > 0) {
            var value = Math.randomInt(weightSum);
            for (var i = 0; i < encounterList.length; i++) {
                value -= encounterList[i].weight;
                if (value < 0) {
                    return encounterList[i].troopId;
                }
            }
        }
        return 0;
    }

    meetsEncounterConditions(encounter) {
        return (encounter.regionSet.length === 0 ||
                encounter.regionSet.contains(this.regionId()));
    }

    executeEncounter() {
        if (!managers.State.$gameMap.isEventRunning() && this._encounterCount <= 0) {
            this.makeEncounterCount();
            var troopId = this.makeEncounterTroopId();
            if (managers.State.$dataTroops[troopId]) {
                managers.BattleManager.setup(troopId, true, false);
                managers.BattleManager.onEncounter();
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    startMapEvent(x, y, triggers, normal) {
        if (!managers.State.$gameMap.isEventRunning()) {
            managers.State.$gameMap.eventsXy(x, y).forEach(function(event) {
                if (event.isTriggerIn(triggers) && event.isNormalPriority() === normal) {
                    event.start();
                }
            });
        }
    }

    moveByInput() {
        if (!this.isMoving() && this.canMove()) {
            var direction = this.getInputDirection();
            if (direction > 0) {
                managers.State.$gameTemp.clearDestination();
            } else if (managers.State.$gameTemp.isDestinationValid()){
                var x = managers.State.$gameTemp.destinationX();
                var y = managers.State.$gameTemp.destinationY();
                direction = this.findDirectionTo(x, y);
            }
            if (direction > 0) {
                this.executeMove(direction);
            }
        }
    }

    canMove() {
        if (managers.State.$gameMap.isEventRunning() || managers.State.$gameMessage.isBusy()) {
            return false;
        }
        if (this.isMoveRouteForcing() || this.areFollowersGathering()) {
            return false;
        }
        if (this._vehicleGettingOn || this._vehicleGettingOff) {
            return false;
        }
        if (this.isInVehicle() && !this.vehicle().canMove()) {
            return false;
        }
        return true;
    }

    getInputDirection() {
        return core.Input.dir4;
    }

    executeMove(direction) {
        this.moveStraight(direction);
    }

    update(sceneActive) {
        var lastScrolledX = this.scrolledX();
        var lastScrolledY = this.scrolledY();
        var wasMoving = this.isMoving();
        this.updateDashing();
        if (sceneActive) {
            this.moveByInput();
        }
        super.update();
        this.updateScroll(lastScrolledX, lastScrolledY);
        this.updateVehicle();
        if (!this.isMoving()) {
            this.updateNonmoving(wasMoving);
        }
        this._followers.update();
    }

    updateDashing() {
        if (this.isMoving()) {
            return;
        }
        if (this.canMove() && !this.isInVehicle() && !managers.State.$gameMap.isDashDisabled()) {
            this._dashing = this.isDashButtonPressed() || managers.State.$gameTemp.isDestinationValid();
        } else {
            this._dashing = false;
        }
    }

    isDashButtonPressed() {
        var shift = core.Input.isPressed('shift');
        if (managers.ConfigManager.alwaysDash) {
            return !shift;
        } else {
            return shift;
        }
    }

    updateScroll(lastScrolledX, lastScrolledY) {
        var x1 = lastScrolledX;
        var y1 = lastScrolledY;
        var x2 = this.scrolledX();
        var y2 = this.scrolledY();
        if (y2 > y1 && y2 > this.centerY()) {
            managers.State.$gameMap.scrollDown(y2 - y1);
        }
        if (x2 < x1 && x2 < this.centerX()) {
            managers.State.$gameMap.scrollLeft(x1 - x2);
        }
        if (x2 > x1 && x2 > this.centerX()) {
            managers.State.$gameMap.scrollRight(x2 - x1);
        }
        if (y2 < y1 && y2 < this.centerY()) {
            managers.State.$gameMap.scrollUp(y1 - y2);
        }
    }

    updateVehicle() {
        if (this.isInVehicle() && !this.areFollowersGathering()) {
            if (this._vehicleGettingOn) {
                this.updateVehicleGetOn();
            } else if (this._vehicleGettingOff) {
                this.updateVehicleGetOff();
            } else {
                this.vehicle().syncWithPlayer();
            }
        }
    }

    updateVehicleGetOn() {
        if (!this.areFollowersGathering() && !this.isMoving()) {
            this.setDirection(this.vehicle().direction());
            this.setMoveSpeed(this.vehicle().moveSpeed());
            this._vehicleGettingOn = false;
            this.setTransparent(true);
            if (this.isInAirship()) {
                this.setThrough(true);
            }
            this.vehicle().getOn();
        }
    }

    updateVehicleGetOff() {
        if (!this.areFollowersGathering() && this.vehicle().isLowest()) {
            this._vehicleGettingOff = false;
            this._vehicleType = 'walk';
            this.setTransparent(false);
        }
    }

    updateNonmoving(wasMoving) {
        if (!managers.State.$gameMap.isEventRunning()) {
            if (wasMoving) {
                managers.State.$gameParty.onPlayerWalk();
                this.checkEventTriggerHere([1,2]);
                if (managers.State.$gameMap.setupStartingEvent()) {
                    return;
                }
            }
            if (this.triggerAction()) {
                return;
            }
            if (wasMoving) {
                this.updateEncounterCount();
            } else {
                managers.State.$gameTemp.clearDestination();
            }
        }
    }

    triggerAction() {
        if (this.canMove()) {
            if (this.triggerButtonAction()) {
                return true;
            }
            if (this.triggerTouchAction()) {
                return true;
            }
        }
        return false;
    }

    triggerButtonAction() {
        if (core.Input.isTriggered('ok')) {
            if (this.getOnOffVehicle()) {
                return true;
            }
            this.checkEventTriggerHere([0]);
            if (managers.State.$gameMap.setupStartingEvent()) {
                return true;
            }
            this.checkEventTriggerThere([0,1,2]);
            if (managers.State.$gameMap.setupStartingEvent()) {
                return true;
            }
        }
        return false;
    }

    triggerTouchAction() {
        if (managers.State.$gameTemp.isDestinationValid()){
            var direction = this.direction();
            var x1 = this.x;
            var y1 = this.y;
            var x2 = managers.State.$gameMap.roundXWithDirection(x1, direction);
            var y2 = managers.State.$gameMap.roundYWithDirection(y1, direction);
            var x3 = managers.State.$gameMap.roundXWithDirection(x2, direction);
            var y3 = managers.State.$gameMap.roundYWithDirection(y2, direction);
            var destX = managers.State.$gameTemp.destinationX();
            var destY = managers.State.$gameTemp.destinationY();
            if (destX === x1 && destY === y1) {
                return this.triggerTouchActionD1(x1, y1);
            } else if (destX === x2 && destY === y2) {
                return this.triggerTouchActionD2(x2, y2);
            } else if (destX === x3 && destY === y3) {
                return this.triggerTouchActionD3(x2, y2);
            }
        }
        return false;
    }

    triggerTouchActionD1(x1, y1) {
        if (managers.State.$gameMap.airship().pos(x1, y1)) {
            if (core.TouchInput.isTriggered() && this.getOnOffVehicle()) {
                return true;
            }
        }
        this.checkEventTriggerHere([0]);
        return managers.State.$gameMap.setupStartingEvent();
    }

    triggerTouchActionD2(x2, y2) {
        if (managers.State.$gameMap.boat().pos(x2, y2) || managers.State.$gameMap.ship().pos(x2, y2)) {
            if (core.TouchInput.isTriggered() && this.getOnVehicle()) {
                return true;
            }
        }
        if (this.isInBoat() || this.isInShip()) {
            if (core.TouchInput.isTriggered() && this.getOffVehicle()) {
                return true;
            }
        }
        this.checkEventTriggerThere([0,1,2]);
        return managers.State.$gameMap.setupStartingEvent();
    }

    triggerTouchActionD3(x2, y2) {
        if (managers.State.$gameMap.isCounter(x2, y2)) {
            this.checkEventTriggerThere([0,1,2]);
        }
        return managers.State.$gameMap.setupStartingEvent();
    }

    updateEncounterCount() {
        if (this.canEncounter()) {
            this._encounterCount -= this.encounterProgressValue();
        }
    }

    canEncounter() {
        return (!managers.State.$gameParty.hasEncounterNone() && managers.State.$gameSystem.isEncounterEnabled() &&
                !this.isInAirship() && !this.isMoveRouteForcing() && !this.isDebugThrough());
    }

    encounterProgressValue() {
        var value = managers.State.$gameMap.isBush(this.x, this.y) ? 2 : 1;
        if (managers.State.$gameParty.hasEncounterHalf()) {
            value *= 0.5;
        }
        if (this.isInShip()) {
            value *= 0.5;
        }
        return value;
    }

    checkEventTriggerHere(triggers) {
        if (this.canStartLocalEvents()) {
            this.startMapEvent(this.x, this.y, triggers, false);
        }
    }

    checkEventTriggerThere(triggers) {
        if (this.canStartLocalEvents()) {
            var direction = this.direction();
            var x1 = this.x;
            var y1 = this.y;
            var x2 = managers.State.$gameMap.roundXWithDirection(x1, direction);
            var y2 = managers.State.$gameMap.roundYWithDirection(y1, direction);
            this.startMapEvent(x2, y2, triggers, true);
            if (!managers.State.$gameMap.isAnyEventStarting() && managers.State.$gameMap.isCounter(x2, y2)) {
                var x3 = managers.State.$gameMap.roundXWithDirection(x2, direction);
                var y3 = managers.State.$gameMap.roundYWithDirection(y2, direction);
                this.startMapEvent(x3, y3, triggers, true);
            }
        }
    }

    checkEventTriggerTouch(x, y) {
        if (this.canStartLocalEvents()) {
            this.startMapEvent(x, y, [1,2], true);
        }
    }

    canStartLocalEvents() {
        return !this.isInAirship();
    }

    getOnOffVehicle() {
        if (this.isInVehicle()) {
            return this.getOffVehicle();
        } else {
            return this.getOnVehicle();
        }
    }

    getOnVehicle() {
        var direction = this.direction();
        var x1 = this.x;
        var y1 = this.y;
        var x2 = managers.State.$gameMap.roundXWithDirection(x1, direction);
        var y2 = managers.State.$gameMap.roundYWithDirection(y1, direction);
        if (managers.State.$gameMap.airship().pos(x1, y1)) {
            this._vehicleType = 'airship';
        } else if (managers.State.$gameMap.ship().pos(x2, y2)) {
            this._vehicleType = 'ship';
        } else if (managers.State.$gameMap.boat().pos(x2, y2)) {
            this._vehicleType = 'boat';
        }
        if (this.isInVehicle()) {
            this._vehicleGettingOn = true;
            if (!this.isInAirship()) {
                this.forceMoveForward();
            }
            this.gatherFollowers();
        }
        return this._vehicleGettingOn;
    }

    getOffVehicle() {
        if (this.vehicle().isLandOk(this.x, this.y, this.direction())) {
            if (this.isInAirship()) {
                this.setDirection(2);
            }
            this._followers.synchronize(this.x, this.y, this.direction());
            this.vehicle().getOff();
            if (!this.isInAirship()) {
                this.forceMoveForward();
                this.setTransparent(false);
            }
            this._vehicleGettingOff = true;
            this.setMoveSpeed(4);
            this.setThrough(false);
            this.makeEncounterCount();
            this.gatherFollowers();
        }
        return this._vehicleGettingOff;
    }

    forceMoveForward() {
        this.setThrough(true);
        this.moveForward();
        this.setThrough(false);
    }

    isOnDamageFloor() {
        return managers.State.$gameMap.isDamageFloor(this.x, this.y) && !this.isInAirship();
    }

    moveStraight(d) {
        if (this.canPass(this.x, this.y, d)) {
            this._followers.updateMove();
        }
        super.moveStraight(d);
    }

    moveDiagonally(horz, vert) {
        if (this.canPassDiagonally(this.x, this.y, horz, vert)) {
            this._followers.updateMove();
        }
        super.moveDiagonally(horz, vert);
    }

    jump(xPlus, yPlus) {
        super.jump(xPlus, yPlus);
        this._followers.jumpAll();
    }

    showFollowers() {
        this._followers.show();
    }

    hideFollowers() {
        this._followers.hide();
    }

    gatherFollowers() {
        this._followers.gather();
    }

    areFollowersGathering() {
        return this._followers.areGathering();
    }

    areFollowersGathered() {
        return this._followers.areGathered();
    }
}

export {Player};
