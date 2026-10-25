import * as core from './index.js';

class Rectangle extends core.Render2D.Rectangle {
    static emptyRectangle = new Rectangle();
    initialize(x = 0, y = 0, width = 0, height = 0) { Object.assign(this, {x, y, width, height}); }
}

export {Rectangle};
