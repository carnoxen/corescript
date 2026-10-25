import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as scenes from './index.js';

//-----------------------------------------------------------------------------
// Gameover
//
// The scene class of the game over screen.
class Gameover extends scenes.Base {
    initialize() {
        super.initialize();
    }

    create() {
        super.create();
        this.playGameoverMusic();
        this.createBackground();
    }

    start() {
        super.start();
        this.startFadeIn(this.slowFadeSpeed(), false);
    }

    update() {
        if (this.isActive() && !this.isBusy() && this.isTriggered()) {
            this.gotoTitle();
        }
        super.update();
    }

    stop() {
        super.stop();
        this.fadeOutAll();
    }

    terminate() {
        super.terminate();
        managers.AudioManager.stopAll();
    }

    playGameoverMusic() {
        managers.AudioManager.stopBgm();
        managers.AudioManager.stopBgs();
        managers.AudioManager.playMe(managers.State.$dataSystem.gameoverMe);
    }

    createBackground() {
        this._backSprite = new core.Sprite();
        this._backSprite.bitmap = managers.ImageManager.loadSystem('GameOver');
        this.addChild(this._backSprite);
    }

    isTriggered() {
        return core.Input.isTriggered('ok') || core.TouchInput.isTriggered();
    }

    gotoTitle() {
        managers.SceneManager.goto(scenes.Title);
    }
}

export {Gameover};
