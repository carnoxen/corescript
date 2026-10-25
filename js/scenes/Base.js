import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as scenes from './index.js';

//=============================================================================

/**
 * The Superclass of all scene within the game.
 *
 * @class Base
 * @constructor
 * @extends Stage
 */
class Base extends core.Stage {
    /**
     * Create a instance of Base.
     *
     * @instance
     * @memberof Base
     */
    initialize() {
        super.initialize();
        this._active = false;
        this._fadeSign = 0;
        this._fadeDuration = 0;
        this._fadeSprite = null;
        this._imageReservationId = core.Utils.generateRuntimeId();
    }

    /**
     * Attach a reservation to the reserve queue.
     *
     * @method attachReservation
     * @instance
     * @memberof Base
     */
    attachReservation() {
        managers.ImageManager.setDefaultReservationId(this._imageReservationId);
    }

    /**
     * Remove the reservation from the Reserve queue.
     *
     * @method detachReservation
     * @instance
     * @memberof Base
     */
    detachReservation() {
        managers.ImageManager.releaseReservation(this._imageReservationId);
    }

    /**
     * Create the components and add them to the rendering process.
     *
     * @method create
     * @instance
     * @memberof Base
     */
    create() {
    }

    /**
     * Returns whether the scene is active or not.
     *
     * @method isActive
     * @instance
     * @memberof Base
     * @return {Boolean} return true if the scene is active
     */
    isActive() {
        return this._active;
    }

    /**
     * Return whether the scene is ready to start or not.
     *
     * @method isReady
     * @instance
     * @memberof Base
     * @return {Boolean} Return true if the scene is ready to start
     */
    isReady() {
        return managers.ImageManager.isReady();
    }

    /**
     * Start the scene processing.
     *
     * @method start
     * @instance
     * @memberof Base
     */
    start() {
        this._active = true;
    }

    /**
     * Update the scene processing each new frame.
     *
     * @method update
     * @instance
     * @memberof Base
     */
    update() {
        this.updateFade();
        this.updateChildren();
    }

    /**
     * Stop the scene processing.
     *
     * @method stop
     * @instance
     * @memberof Base
     */
    stop() {
        this._active = false;
    }

    /**
     * Return whether the scene is busy or not.
     *
     * @method isBusy
     * @instance
     * @memberof Base
     * @return {Boolean} Return true if the scene is currently busy
     */
    isBusy() {
        return this._fadeDuration > 0;
    }

    /**
     * Terminate the scene before switching to a another scene.
     *
     * @method terminate
     * @instance
     * @memberof Base
     */
    terminate() {
    }

    /**
     * Create the layer for the windows children
     * and add it to the rendering process.
     *
     * @method createWindowLayer
     * @instance
     * @memberof Base
     */
    createWindowLayer() {
        var width = core.Graphics.boxWidth;
        var height = core.Graphics.boxHeight;
        var x = (core.Graphics.width - width) / 2;
        var y = (core.Graphics.height - height) / 2;
        this._windowLayer = new core.WindowLayer();
        this._windowLayer.move(x, y, width, height);
        this.addChild(this._windowLayer);
    }

    /**
     * Add the children window to the windowLayer processing.
     *
     * @method addWindow
     * @instance
     * @memberof Base
     */
    addWindow(window) {
        this._windowLayer.addChild(window);
    }

    /**
     * Request a fadeIn screen process.
     *
     * @method startFadeIn
     * @param {Number} [duration=30] The time the process will take for fadeIn the screen
     * @param {Boolean} [white=false] If true the fadein will be process with a white color else it's will be black
     *
     * @instance
     * @memberof Base
     */
    startFadeIn(duration, white) {
        this.createFadeSprite(white);
        this._fadeSign = 1;
        this._fadeDuration = duration || 30;
        this._fadeSprite.opacity = 255;
    }

    /**
     * Request a fadeOut screen process.
     *
     * @method startFadeOut
     * @param {Number} [duration=30] The time the process will take for fadeOut the screen
     * @param {Boolean} [white=false] If true the fadeOut will be process with a white color else it's will be black
     *
     * @instance
     * @memberof Base
     */
    startFadeOut(duration, white) {
        this.createFadeSprite(white);
        this._fadeSign = -1;
        this._fadeDuration = duration || 30;
        this._fadeSprite.opacity = 0;
    }

    /**
     * Create a Screen sprite for the fadein and fadeOut purpose and
     * add it to the rendering process.
     *
     * @method createFadeSprite
     * @instance
     * @memberof Base
     */
    createFadeSprite(white) {
        if (!this._fadeSprite) {
            this._fadeSprite = new core.ScreenSprite();
            this.addChild(this._fadeSprite);
        }
        if (white) {
            this._fadeSprite.setWhite();
        } else {
            this._fadeSprite.setBlack();
        }
    }

    /**
     * Update the screen fade processing.
     *
     * @method updateFade
     * @instance
     * @memberof Base
     */
    updateFade() {
        if (this._fadeDuration > 0) {
            var d = this._fadeDuration;
            if (this._fadeSign > 0) {
                this._fadeSprite.opacity -= this._fadeSprite.opacity / d;
            } else {
                this._fadeSprite.opacity += (255 - this._fadeSprite.opacity) / d;
            }
            this._fadeDuration--;
        }
    }

    /**
     * Update the children of the scene EACH frame.
     *
     * @method updateChildren
     * @instance
     * @memberof Base
     */
    updateChildren() {
        this.children.forEach(function(child) {
            if (child.update) {
                child.update();
            }
        });
    }

    /**
     * Pop the scene from the stack array and switch to the
     * previous scene.
     *
     * @method popScene
     * @instance
     * @memberof Base
     */
    popScene() {
        managers.SceneManager.pop();
    }

    /**
     * Check whether the game should be triggering a gameover.
     *
     * @method checkGameover
     * @instance
     * @memberof Base
     */
    checkGameover() {
        if (managers.State.$gameParty.isAllDead()) {
            managers.SceneManager.goto(scenes.Gameover);
        }
    }

    /**
     * Slowly fade out all the visual and audio of the scene.
     *
     * @method fadeOutAll
     * @instance
     * @memberof Base
     */
    fadeOutAll() {
        var time = this.slowFadeSpeed() / 60;
        managers.AudioManager.fadeOutBgm(time);
        managers.AudioManager.fadeOutBgs(time);
        managers.AudioManager.fadeOutMe(time);
        this.startFadeOut(this.slowFadeSpeed());
    }

    /**
     * Return the screen fade speed value.
     *
     * @method fadeSpeed
     * @instance
     * @memberof Base
     * @return {Number} Return the fade speed
     */
    fadeSpeed() {
        return 24;
    }

    /**
     * Return a slow screen fade speed value.
     *
     * @method slowFadeSpeed
     * @instance
     * @memberof Base
     * @return {Number} Return the fade speed
     */
    slowFadeSpeed() {
        return this.fadeSpeed() * 2;
    }
}

export {Base};
