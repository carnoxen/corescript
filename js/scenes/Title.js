import * as core from '../core/index.js';
import * as managers from '../managers/index.js';
import * as scenes from './index.js';
import * as windows from '../windows/index.js';

//-----------------------------------------------------------------------------
// Title
//
// The scene class of the title screen.
class Title extends scenes.Base {
    initialize() {
        super.initialize();
    }

    create() {
        super.create();
        this.createBackground();
        this.createForeground();
        this.createWindowLayer();
        this.createCommandWindow();
    }

    start() {
        super.start();
        managers.SceneManager.clearStack();
        this.centerSprite(this._backSprite1);
        this.centerSprite(this._backSprite2);
        this.playTitleMusic();
        this.startFadeIn(this.fadeSpeed(), false);
    }

    update() {
        if (!this.isBusy()) {
            this._commandWindow.open();
        }
        super.update();
    }

    isBusy() {
        return this._commandWindow.isClosing() || super.isBusy();
    }

    terminate() {
        super.terminate();
        managers.SceneManager.snapForBackground();
    }

    createBackground() {
        this._backSprite1 = new core.Sprite(managers.ImageManager.loadTitle1(managers.State.$dataSystem.title1Name));
        this._backSprite2 = new core.Sprite(managers.ImageManager.loadTitle2(managers.State.$dataSystem.title2Name));
        this.addChild(this._backSprite1);
        this.addChild(this._backSprite2);
    }

    createForeground() {
        this._gameTitleSprite = new core.Sprite(new core.Bitmap(core.Graphics.width, core.Graphics.height));
        this.addChild(this._gameTitleSprite);
        if (managers.State.$dataSystem.optDrawTitle) {
            this.drawGameTitle();
        }
    }

    drawGameTitle() {
        var x = 20;
        var y = core.Graphics.height / 4;
        var maxWidth = core.Graphics.width - x * 2;
        var text = managers.State.$dataSystem.gameTitle;
        this._gameTitleSprite.bitmap.outlineColor = 'black';
        this._gameTitleSprite.bitmap.outlineWidth = 8;
        this._gameTitleSprite.bitmap.fontSize = 72;
        this._gameTitleSprite.bitmap.drawText(text, x, y, maxWidth, 48, 'center');
    }

    centerSprite(sprite) {
        sprite.x = core.Graphics.width / 2;
        sprite.y = core.Graphics.height / 2;
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
    }

    createCommandWindow() {
        this._commandWindow = new windows.TitleCommand();
        this._commandWindow.setHandler('newGame',  this.commandNewGame.bind(this));
        this._commandWindow.setHandler('continue', this.commandContinue.bind(this));
        this._commandWindow.setHandler('options',  this.commandOptions.bind(this));
        this.addWindow(this._commandWindow);
    }

    commandNewGame() {
        managers.DataManager.setupNewGame();
        this._commandWindow.close();
        this.fadeOutAll();
        managers.SceneManager.goto(scenes.Map);
    }

    commandContinue() {
        this._commandWindow.close();
        managers.SceneManager.push(scenes.Load);
    }

    commandOptions() {
        this._commandWindow.close();
        managers.SceneManager.push(scenes.Options);
    }

    playTitleMusic() {
        managers.AudioManager.playBgm(managers.State.$dataSystem.titleBgm);
        managers.AudioManager.stopBgs();
        managers.AudioManager.stopMe();
    }
}

export {Title};
