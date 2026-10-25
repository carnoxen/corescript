import * as core from '../core/index.js';
import * as managers from '../managers/index.js';

//-----------------------------------------------------------------------------
// CharacterBase
//
// The superclass of objects.Character. It handles basic information, such as
// coordinates and images, shared by all characters.
class CharacterBase {
    constructor(...args) { this.initialize(...args); }

    get x() { return this._x; }

    get y() { return this._y; }

    initialize() {
        this.initMembers();
    }

    initMembers() {
        this._x = 0;
        this._y = 0;
        this._realX = 0;
        this._realY = 0;
        this._moveSpeed = 4;
        this._moveFrequency = 6;
        this._opacity = 255;
        this._blendMode = 0;
        this._direction = 2;
        this._pattern = 1;
        this._priorityType = 1;
        this._tileId = 0;
        this._characterName = '';
        this._characterIndex = 0;
        this._isObjectCharacter = false;
        this._walkAnime = true;
        this._stepAnime = false;
        this._directionFix = false;
        this._through = false;
        this._transparent = false;
        this._bushDepth = 0;
        this._animationId = 0;
        this._balloonId = 0;
        this._animationPlaying = false;
        this._balloonPlaying = false;
        this._animationCount = 0;
        this._stopCount = 0;
        this._jumpCount = 0;
        this._jumpPeak = 0;
        this._movementSuccess = true;
    }

    pos(x, y) {
        return this._x === x && this._y === y;
    }

    posNt(x, y) {
        // No through
        return this.pos(x, y) && !this.isThrough();
    }

    moveSpeed() {
        return this._moveSpeed;
    }

    setMoveSpeed(moveSpeed) {
        this._moveSpeed = moveSpeed;
    }

    moveFrequency() {
        return this._moveFrequency;
    }

    setMoveFrequency(moveFrequency) {
        this._moveFrequency = moveFrequency;
    }

    opacity() {
        return this._opacity;
    }

    setOpacity(opacity) {
        this._opacity = opacity;
    }

    blendMode() {
        return this._blendMode;
    }

    setBlendMode(blendMode) {
        this._blendMode = blendMode;
    }

    isNormalPriority() {
        return this._priorityType === 1;
    }

    setPriorityType(priorityType) {
        this._priorityType = priorityType;
    }

    isMoving() {
        return this._realX !== this._x || this._realY !== this._y;
    }

    isJumping() {
        return this._jumpCount > 0;
    }

    jumpHeight() {
        return (this._jumpPeak * this._jumpPeak -
                Math.pow(Math.abs(this._jumpCount - this._jumpPeak), 2)) / 2;
    }

    isStopping() {
        return !this.isMoving() && !this.isJumping();
    }

    checkStop(threshold) {
        return this._stopCount > threshold;
    }

    resetStopCount() {
        this._stopCount = 0;
    }

    realMoveSpeed() {
        return this._moveSpeed + (this.isDashing() ? 1 : 0);
    }

    distancePerFrame() {
        return Math.pow(2, this.realMoveSpeed()) / 256;
    }

    isDashing() {
        return false;
    }

    isDebugThrough() {
        return false;
    }

    straighten() {
        if (this.hasWalkAnime() || this.hasStepAnime()) {
            this._pattern = 1;
        }
        this._animationCount = 0;
    }

    reverseDir(d) {
        return 10 - d;
    }

    canPass(x, y, d) {
        var x2 = managers.State.$gameMap.roundXWithDirection(x, d);
        var y2 = managers.State.$gameMap.roundYWithDirection(y, d);
        if (!managers.State.$gameMap.isValid(x2, y2)) {
            return false;
        }
        if (this.isThrough() || this.isDebugThrough()) {
            return true;
        }
        if (!this.isMapPassable(x, y, d)) {
            return false;
        }
        if (this.isCollidedWithCharacters(x2, y2)) {
            return false;
        }
        return true;
    }

    canPassDiagonally(x, y, horz, vert) {
        var x2 = managers.State.$gameMap.roundXWithDirection(x, horz);
        var y2 = managers.State.$gameMap.roundYWithDirection(y, vert);
        if (this.canPass(x, y, vert) && this.canPass(x, y2, horz)) {
            return true;
        }
        if (this.canPass(x, y, horz) && this.canPass(x2, y, vert)) {
            return true;
        }
        return false;
    }

    isMapPassable(x, y, d) {
        var x2 = managers.State.$gameMap.roundXWithDirection(x, d);
        var y2 = managers.State.$gameMap.roundYWithDirection(y, d);
        var d2 = this.reverseDir(d);
        return managers.State.$gameMap.isPassable(x, y, d) && managers.State.$gameMap.isPassable(x2, y2, d2);
    }

    isCollidedWithCharacters(x, y) {
        return this.isCollidedWithEvents(x, y) || this.isCollidedWithVehicles(x, y);
    }

    isCollidedWithEvents(x, y) {
        var events = managers.State.$gameMap.eventsXyNt(x, y);
        return events.some(function(event) {
            return event.isNormalPriority();
        });
    }

    isCollidedWithVehicles(x, y) {
        return managers.State.$gameMap.boat().posNt(x, y) || managers.State.$gameMap.ship().posNt(x, y);
    }

    setPosition(x, y) {
        this._x = Math.round(x);
        this._y = Math.round(y);
        this._realX = x;
        this._realY = y;
    }

    copyPosition(character) {
        this._x = character._x;
        this._y = character._y;
        this._realX = character._realX;
        this._realY = character._realY;
        this._direction = character._direction;
    }

    locate(x, y) {
        this.setPosition(x, y);
        this.straighten();
        this.refreshBushDepth();
    }

    direction() {
        return this._direction;
    }

    setDirection(d) {
        if (!this.isDirectionFixed() && d) {
            this._direction = d;
        }
        this.resetStopCount();
    }

    isTile() {
        return this._tileId > 0 && this._priorityType === 0;
    }

    isObjectCharacter() {
        return this._isObjectCharacter;
    }

    shiftY() {
        return this.isObjectCharacter() ? 0 : 6;
    }

    scrolledX() {
        return managers.State.$gameMap.adjustX(this._realX);
    }

    scrolledY() {
        return managers.State.$gameMap.adjustY(this._realY);
    }

    screenX() {
        var tw = managers.State.$gameMap.tileWidth();
        return Math.round(this.scrolledX() * tw + tw / 2);
    }

    screenY() {
        var th = managers.State.$gameMap.tileHeight();
        return Math.round(this.scrolledY() * th + th -
                          this.shiftY() - this.jumpHeight());
    }

    screenZ() {
        return this._priorityType * 2 + 1;
    }

    isNearTheScreen() {
        var gw = core.Graphics.width;
        var gh = core.Graphics.height;
        var tw = managers.State.$gameMap.tileWidth();
        var th = managers.State.$gameMap.tileHeight();
        var px = this.scrolledX() * tw + tw / 2 - gw / 2;
        var py = this.scrolledY() * th + th / 2 - gh / 2;
        return px >= -gw && px <= gw && py >= -gh && py <= gh;
    }

    update() {
        if (this.isStopping()) {
            this.updateStop();
        }
        if (this.isJumping()) {
            this.updateJump();
        } else if (this.isMoving()) {
            this.updateMove();
        }
        this.updateAnimation();
    }

    updateStop() {
        this._stopCount++;
    }

    updateJump() {
        this._jumpCount--;
        this._realX = (this._realX * this._jumpCount + this._x) / (this._jumpCount + 1.0);
        this._realY = (this._realY * this._jumpCount + this._y) / (this._jumpCount + 1.0);
        this.refreshBushDepth();
        if (this._jumpCount === 0) {
            this._realX = this._x = managers.State.$gameMap.roundX(this._x);
            this._realY = this._y = managers.State.$gameMap.roundY(this._y);
        }
    }

    updateMove() {
        if (this._x < this._realX) {
            this._realX = Math.max(this._realX - this.distancePerFrame(), this._x);
        }
        if (this._x > this._realX) {
            this._realX = Math.min(this._realX + this.distancePerFrame(), this._x);
        }
        if (this._y < this._realY) {
            this._realY = Math.max(this._realY - this.distancePerFrame(), this._y);
        }
        if (this._y > this._realY) {
            this._realY = Math.min(this._realY + this.distancePerFrame(), this._y);
        }
        if (!this.isMoving()) {
            this.refreshBushDepth();
        }
    }

    updateAnimation() {
        this.updateAnimationCount();
        if (this._animationCount >= this.animationWait()) {
            this.updatePattern();
            this._animationCount = 0;
        }
    }

    animationWait() {
        return (9 - this.realMoveSpeed()) * 3;
    }

    updateAnimationCount() {
        if (this.isMoving() && this.hasWalkAnime()) {
            this._animationCount += 1.5;
        } else if (this.hasStepAnime() || !this.isOriginalPattern()) {
            this._animationCount++;
        }
    }

    updatePattern() {
        if (!this.hasStepAnime() && this._stopCount > 0) {
            this.resetPattern();
        } else {
            this._pattern = (this._pattern + 1) % this.maxPattern();
        }
    }

    maxPattern() {
        return 4;
    }

    pattern() {
        return this._pattern < 3 ? this._pattern : 1;
    }

    setPattern(pattern) {
        this._pattern = pattern;
    }

    isOriginalPattern() {
        return this.pattern() === 1;
    }

    resetPattern() {
        this.setPattern(1);
    }

    refreshBushDepth() {
        if (this.isNormalPriority() && !this.isObjectCharacter() &&
                this.isOnBush() && !this.isJumping()) {
            if (!this.isMoving()) {
                this._bushDepth = 12;
            }
        } else {
            this._bushDepth = 0;
        }
    }

    isOnLadder() {
        return managers.State.$gameMap.isLadder(this._x, this._y);
    }

    isOnBush() {
        return managers.State.$gameMap.isBush(this._x, this._y);
    }

    terrainTag() {
        return managers.State.$gameMap.terrainTag(this._x, this._y);
    }

    regionId() {
        return managers.State.$gameMap.regionId(this._x, this._y);
    }

    increaseSteps() {
        if (this.isOnLadder()) {
            this.setDirection(8);
        }
        this.resetStopCount();
        this.refreshBushDepth();
    }

    tileId() {
        return this._tileId;
    }

    characterName() {
        return this._characterName;
    }

    characterIndex() {
        return this._characterIndex;
    }

    setImage(characterName, characterIndex) {
        this._tileId = 0;
        this._characterName = characterName;
        this._characterIndex = characterIndex;
        this._isObjectCharacter = managers.ImageManager.isObjectCharacter(characterName);
    }

    setTileImage(tileId) {
        this._tileId = tileId;
        this._characterName = '';
        this._characterIndex = 0;
        this._isObjectCharacter = true;
    }

    checkEventTriggerTouchFront(d) {
        var x2 = managers.State.$gameMap.roundXWithDirection(this._x, d);
        var y2 = managers.State.$gameMap.roundYWithDirection(this._y, d);
        this.checkEventTriggerTouch(x2, y2);
    }

    checkEventTriggerTouch(x, y) {
        return false;
    }

    isMovementSucceeded(x, y) {
        return this._movementSuccess;
    }

    setMovementSuccess(success) {
        this._movementSuccess = success;
    }

    moveStraight(d) {
        this.setMovementSuccess(this.canPass(this._x, this._y, d));
        if (this.isMovementSucceeded()) {
            this.setDirection(d);
            this._x = managers.State.$gameMap.roundXWithDirection(this._x, d);
            this._y = managers.State.$gameMap.roundYWithDirection(this._y, d);
            this._realX = managers.State.$gameMap.xWithDirection(this._x, this.reverseDir(d));
            this._realY = managers.State.$gameMap.yWithDirection(this._y, this.reverseDir(d));
            this.increaseSteps();
        } else {
            this.setDirection(d);
            this.checkEventTriggerTouchFront(d);
        }
    }

    moveDiagonally(horz, vert) {
        this.setMovementSuccess(this.canPassDiagonally(this._x, this._y, horz, vert));
        if (this.isMovementSucceeded()) {
            this._x = managers.State.$gameMap.roundXWithDirection(this._x, horz);
            this._y = managers.State.$gameMap.roundYWithDirection(this._y, vert);
            this._realX = managers.State.$gameMap.xWithDirection(this._x, this.reverseDir(horz));
            this._realY = managers.State.$gameMap.yWithDirection(this._y, this.reverseDir(vert));
            this.increaseSteps();
        }
        if (this._direction === this.reverseDir(horz)) {
            this.setDirection(horz);
        }
        if (this._direction === this.reverseDir(vert)) {
            this.setDirection(vert);
        }
    }

    jump(xPlus, yPlus) {
        if (Math.abs(xPlus) > Math.abs(yPlus)) {
            if (xPlus !== 0) {
                this.setDirection(xPlus < 0 ? 4 : 6);
            }
        } else {
            if (yPlus !== 0) {
                this.setDirection(yPlus < 0 ? 8 : 2);
            }
        }
        this._x += xPlus;
        this._y += yPlus;
        var distance = Math.round(Math.sqrt(xPlus * xPlus + yPlus * yPlus));
        this._jumpPeak = 10 + distance - this._moveSpeed;
        this._jumpCount = this._jumpPeak * 2;
        this.resetStopCount();
        this.straighten();
    }

    hasWalkAnime() {
        return this._walkAnime;
    }

    setWalkAnime(walkAnime) {
        this._walkAnime = walkAnime;
    }

    hasStepAnime() {
        return this._stepAnime;
    }

    setStepAnime(stepAnime) {
        this._stepAnime = stepAnime;
    }

    isDirectionFixed() {
        return this._directionFix;
    }

    setDirectionFix(directionFix) {
        this._directionFix = directionFix;
    }

    isThrough() {
        return this._through;
    }

    setThrough(through) {
        this._through = through;
    }

    isTransparent() {
        return this._transparent;
    }

    bushDepth() {
        return this._bushDepth;
    }

    setTransparent(transparent) {
        this._transparent = transparent;
    }

    requestAnimation(animationId) {
        this._animationId = animationId;
    }

    requestBalloon(balloonId) {
        this._balloonId = balloonId;
    }

    animationId() {
        return this._animationId;
    }

    balloonId() {
        return this._balloonId;
    }

    startAnimation() {
        this._animationId = 0;
        this._animationPlaying = true;
    }

    startBalloon() {
        this._balloonId = 0;
        this._balloonPlaying = true;
    }

    isAnimationPlaying() {
        return this._animationId > 0 || this._animationPlaying;
    }

    isBalloonPlaying() {
        return this._balloonId > 0 || this._balloonPlaying;
    }

    endAnimation() {
        this._animationPlaying = false;
    }

    endBalloon() {
        this._balloonPlaying = false;
    }
}

export {CharacterBase};
