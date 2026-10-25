import * as core from './index.js';

class Sprite extends core.Render2D.Sprite {
    static _counter = 0;
    constructor(...args) {
        super(new core.Render2D.Texture());
        this.initialize(...args);
    }
    initialize(bitmap = null) {
        core.Render2D.Sprite.initialize(this, new core.Render2D.Texture());
        this._bitmap = null;
        this._frame = new core.Rectangle();
        this._realFrame = new core.Rectangle();
        this._blendColor = [0, 0, 0, 0];
        this._colorTone = [0, 0, 0, 0];
        this.spriteId = Sprite._counter++;
        this.opaque = false;
        this.bitmap = bitmap;
    }
    get bitmap() { return this._bitmap; }
    set bitmap(value) {
        if (this._bitmap === value) return;
        this._bitmap = value;
        this._refreshFrame = !!value;
        if (value) value.addLoadListener(bitmap => this._onBitmapLoad(bitmap));
        else this.texture.frame = core.Rectangle.emptyRectangle;
    }
    get width() { return this._frame.width; }
    set width(value) { this._frame.width = value; this._refresh(); }
    get height() { return this._frame.height; }
    set height(value) { this._frame.height = value; this._refresh(); }
    get opacity() { return this.alpha * 255; }
    set opacity(value) { this.alpha = Math.max(0, Math.min(255, value)) / 255; }
    update() { for (const child of this.children) child.update?.(); }
    move(x, y) { this.x = x; this.y = y; }
    setFrame(x, y, width, height) {
        this._refreshFrame = false;
        Object.assign(this._frame, {x, y, width, height});
        this._refresh();
    }
    getBlendColor() { return [...this._blendColor]; }
    setBlendColor(color) { this._blendColor = [...color]; }
    getColorTone() { return [...this._colorTone]; }
    setColorTone(tone) { this._colorTone = [...tone]; }
    _onBitmapLoad(bitmap) {
        if (bitmap !== this._bitmap) return;
        if (this._refreshFrame) {
            this._refreshFrame = false;
            this._frame.width = bitmap.width;
            this._frame.height = bitmap.height;
        }
        this._refresh();
    }
    _refresh() {
        const frame = this._frame;
        const x = Math.floor(frame.x), y = Math.floor(frame.y);
        const width = Math.floor(frame.width), height = Math.floor(frame.height);
        const bw = this._bitmap?.width ?? 0, bh = this._bitmap?.height ?? 0;
        const rx = Math.max(0, Math.min(bw, x)), ry = Math.max(0, Math.min(bh, y));
        Object.assign(this._realFrame, {x: rx, y: ry, width: Math.max(0, Math.min(bw - rx, width - rx + x)),
            height: Math.max(0, Math.min(bh - ry, height - ry + y))});
        this.pivot.set(x - rx, y - ry);
        if (this._bitmap && !(this._bitmap instanceof core.Render2D.TileSurface)) this.texture.baseTexture = this._bitmap.baseTexture;
        this.texture.frame = this._bitmap ? this._realFrame : this._frame;
        this.texture._updateID++;
    }
    _isInBitmapRect(x, y, width, height) {
        return !!this._bitmap && x + width > 0 && y + height > 0 && x < this._bitmap.width && y < this._bitmap.height;
    }
}

export {Sprite};
