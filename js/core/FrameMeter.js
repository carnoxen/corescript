class FrameMeter {
    constructor() {
        this.element = document.createElement('div');
        this.element.style.cssText = 'position:absolute;left:5px;top:5px;z-index:10;color:white;background:#0009;padding:8px;font:16px monospace;pointer-events:none';
        document.body.append(this.element);
        this.isPaused = true; this.frames = 0; this.last = performance.now(); this.mode = 'fps';
        this.hide();
    }
    tickStart() { this.start = performance.now(); }
    tick() {
        if (this.isPaused) return;
        const now = performance.now(); this.frames++;
        if (now - this.last >= 500) {
            this.element.textContent = this.mode === 'fps' ? `${Math.round(this.frames * 1000 / (now - this.last))} FPS` : `${(now - this.start).toFixed(1)} ms`;
            this.last = now; this.frames = 0;
        }
    }
    hide() { this.isPaused = true; this.element.hidden = true; }
    show() { this.isPaused = false; this.element.hidden = false; this.last = performance.now(); this.frames = 0; }
    showFps() { this.mode = 'fps'; }
    showDuration() { this.mode = 'duration'; }
}

export {FrameMeter};
