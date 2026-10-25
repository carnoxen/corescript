import * as core from './index.js';

class WindowLayer extends core.Render2D.Container {
    constructor(...args) { super(); this.initialize(...args); }
    initialize() { core.Render2D.Container.initialize(this); this._width = 0; this._height = 0; this._isWindowLayer = true; }
    get width() { return this._width; }
    set width(value) { this._width = value; }
    get height() { return this._height; }
    set height(value) { this._height = value; }
    move(x, y, width, height) { Object.assign(this, {x, y, width, height}); }
    update() { for (const child of this.children) child.update?.(); }
}

export {WindowLayer};
