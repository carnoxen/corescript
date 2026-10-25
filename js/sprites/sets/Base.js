import * as core from '../../core/index.js';
import * as managers from '../../managers/index.js';
import * as sprites from '../index.js';

//-----------------------------------------------------------------------------
// Base
//
// The superclass of sets.Map and sets.Battle.
class Base extends core.Sprite {
    initialize() {
        super.initialize();
        this.setFrame(0, 0, core.Graphics.width, core.Graphics.height);
        this._tone = [0, 0, 0, 0];
        this.opaque = true;
        this.createLowerLayer();
        this.createToneChanger();
        this.createUpperLayer();
        this.update();
    }

    createLowerLayer() {
        this.createBaseSprite();
    }

    createUpperLayer() {
        this.createPictures();
        this.createTimer();
        this.createScreenSprites();
    }

    update() {
        super.update();
        this.updateScreenSprites();
        this.updateToneChanger();
        this.updatePosition();
    }

    createBaseSprite() {
        this._baseSprite = new core.Sprite();
        this._baseSprite.setFrame(0, 0, this.width, this.height);
        this._blackScreen = new core.ScreenSprite();
        this._blackScreen.opacity = 255;
        this.addChild(this._baseSprite);
        this._baseSprite.addChild(this._blackScreen);
    }

    createToneChanger() {
        if (core.Graphics.isWebGL()) {
            this.createWebGLToneChanger();
        } else {
            this.createCanvasToneChanger();
        }
    }

    createWebGLToneChanger() {
        var margin = 48;
        var width = core.Graphics.width + margin * 2;
        var height = core.Graphics.height + margin * 2;
        this._toneFilter = new core.ToneFilter();
        this._toneFilter.enabled = false;
        this._baseSprite.filters = [this._toneFilter];
        this._baseSprite.filterArea = new core.Rectangle(-margin, -margin, width, height);
    }

    createCanvasToneChanger() {
        this._toneSprite = new core.ToneSprite();
        this.addChild(this._toneSprite);
    }

    createPictures() {
        var width = core.Graphics.boxWidth;
        var height = core.Graphics.boxHeight;
        var x = (core.Graphics.width - width) / 2;
        var y = (core.Graphics.height - height) / 2;
        this._pictureContainer = new core.Sprite();
        this._pictureContainer.setFrame(x, y, width, height);
        for (var i = 1; i <= managers.State.$gameScreen.maxPictures(); i++) {
            this._pictureContainer.addChild(new sprites.Picture(i));
        }
        this.addChild(this._pictureContainer);
    }

    createTimer() {
        this._timerSprite = new sprites.Timer();
        this.addChild(this._timerSprite);
    }

    createScreenSprites() {
        this._flashSprite = new core.ScreenSprite();
        this._fadeSprite = new core.ScreenSprite();
        this.addChild(this._flashSprite);
        this.addChild(this._fadeSprite);
    }

    updateScreenSprites() {
        var color = managers.State.$gameScreen.flashColor();
        this._flashSprite.setColor(color[0], color[1], color[2]);
        this._flashSprite.opacity = color[3];
        this._fadeSprite.opacity = 255 - managers.State.$gameScreen.brightness();
    }

    updateToneChanger() {
        var tone = managers.State.$gameScreen.tone();
        if (!this._tone.equals(tone)) {
            this._tone = tone.clone();
            if (core.Graphics.isWebGL()) {
                this.updateWebGLToneChanger();
            } else {
                this.updateCanvasToneChanger();
            }
        }
    }

    updateWebGLToneChanger() {
        var tone = this._tone;
        this._toneFilter.reset();
        if (tone[0] || tone[1] || tone[2] || tone[3]) {
            this._toneFilter.enabled = true;
            this._toneFilter.adjustTone(tone[0], tone[1], tone[2]);
            this._toneFilter.adjustSaturation(-tone[3]);
        } else {
            this._toneFilter.enabled = false;
        }
    }

    updateCanvasToneChanger() {
        var tone = this._tone;
        this._toneSprite.setTone(tone[0], tone[1], tone[2], tone[3]);
    }

    updatePosition() {
        var screen = managers.State.$gameScreen;
        var scale = screen.zoomScale();
        this.scale.x = scale;
        this.scale.y = scale;
        this.x = Math.round(-screen.zoomX() * (scale - 1));
        this.y = Math.round(-screen.zoomY() * (scale - 1));
        this.x += Math.round(screen.shake());
    }
}

export {Base};
