import * as core from './index.js';

class TilingSprite extends core.Sprite {
    initialize(bitmap = null) {
        super.initialize();
        this.isTiling = true;
        this._width = 0; this._height = 0;
        this.origin = new core.Point(); this.tilePosition = new core.Point(); this.tileScale = new core.Point(1, 1);
        this.bitmap = bitmap;
    }
    move(x = 0, y = 0, width = 0, height = 0) { Object.assign(this, {x, y, _width: width, _height: height}); }
    updateTransform() { this.tilePosition.set(-Math.round(this.origin.x), -Math.round(this.origin.y)); super.updateTransform(); }
    _refresh() {
        const frame = this._frame.clone();
        if (!frame.width && !frame.height && this._bitmap) { frame.width = this._bitmap.width; frame.height = this._bitmap.height; }
        this.texture.frame = frame;
        if (this._bitmap) this.texture.baseTexture = this._bitmap.baseTexture;
        this.texture._updateID++;
    }
}

export {TilingSprite};
