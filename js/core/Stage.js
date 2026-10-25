import * as core from './index.js';

class Stage extends core.Render2D.Container {
    constructor(...args) { super(); this.initialize(...args); }
    initialize() { core.Render2D.Container.initialize(this); this.interactive = false; }
}

export {Stage};
