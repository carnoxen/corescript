import * as core from './index.js';

class Point extends core.Render2D.Point {
    initialize(x = 0, y = 0) { this.set(x, y); }
}

export {Point};
