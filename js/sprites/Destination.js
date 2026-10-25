import * as core from '../core/index.js';
import * as managers from '../managers/index.js';

//-----------------------------------------------------------------------------
// Destination
//
// The sprite for displaying the destination place of the touch input.
class Destination extends core.Sprite {
    initialize() {
        super.initialize();
        this.createBitmap();
        this._frameCount = 0;
    }

    update() {
        super.update();
        if (managers.State.$gameTemp.isDestinationValid()){
            this.updatePosition();
            this.updateAnimation();
            this.visible = true;
        } else {
            this._frameCount = 0;
            this.visible = false;
        }
    }

    createBitmap() {
        var tileWidth = managers.State.$gameMap.tileWidth();
        var tileHeight = managers.State.$gameMap.tileHeight();
        this.bitmap = new core.Bitmap(tileWidth, tileHeight);
        this.bitmap.fillAll('white');
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this.blendMode = core.Graphics.BLEND_ADD;
    }

    updatePosition() {
        var tileWidth = managers.State.$gameMap.tileWidth();
        var tileHeight = managers.State.$gameMap.tileHeight();
        var x = managers.State.$gameTemp.destinationX();
        var y = managers.State.$gameTemp.destinationY();
        this.x = (managers.State.$gameMap.adjustX(x) + 0.5) * tileWidth;
        this.y = (managers.State.$gameMap.adjustY(y) + 0.5) * tileHeight;
    }

    updateAnimation() {
        this._frameCount++;
        this._frameCount %= 20;
        this.opacity = (20 - this._frameCount) * 6;
        this.scale.x = 1 + this._frameCount / 20;
        this.scale.y = this.scale.x;
    }
}

export {Destination};
