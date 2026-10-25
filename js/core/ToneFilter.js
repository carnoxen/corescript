class ToneFilter {
    constructor() { this.enabled = true; this.reset(); }
    reset() { this.tone = [0, 0, 0, 0]; }
    adjustTone(r = 0, g = 0, b = 0) { this.tone.splice(0, 3, ...[r, g, b].map(v => Math.max(-255, Math.min(255, v)) / 255)); }
    adjustSaturation(value = 0) { this.tone[3] = Math.max(0, Math.min(255, -value)) / 255; }
}

export {ToneFilter};
