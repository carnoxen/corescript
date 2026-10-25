// Native scene graph. Canvas 2D is used only to author bitmap/text assets.
const Render2D = (() => {
    class Point {
        constructor(x = 0, y = 0) { this.set(x, y); }
        set(x = 0, y = x) { this.x = x; this.y = y; return this; }
        clone() { return new Point(this.x, this.y); }
        copy(p) { return this.set(p.x, p.y); }
    }
    class Rectangle {
        constructor(x = 0, y = 0, width = 0, height = 0) {
            Object.assign(this, {x, y, width, height});
        }
        clone() { return new Rectangle(this.x, this.y, this.width, this.height); }
        copy(r) { Object.assign(this, {x: r.x, y: r.y, width: r.width, height: r.height}); return this; }
        contains(x, y) { return x >= this.x && y >= this.y && x < this.x + this.width && y < this.y + this.height; }
    }
    class Matrix {
        constructor() { this.identity(); }
        identity() { Object.assign(this, {a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0}); return this; }
        apply(p) { return new Point(this.a * p.x + this.c * p.y + this.tx, this.b * p.x + this.d * p.y + this.ty); }
    }
    class Container {
        constructor() { Container.initialize(this); }
        static initialize(node) {
            Object.assign(node, {position: new Point(), scale: new Point(1, 1), pivot: new Point(),
                skew: new Point(), rotation: 0, alpha: 1, worldAlpha: 1, visible: true, renderable: true,
                children: [], parent: null, worldTransform: new Matrix(), filters: null, _events: new Map()});
        }
        get x() { return this.position.x; }
        set x(value) { this.position.x = value; }
        get y() { return this.position.y; }
        set y(value) { this.position.y = value; }
        addChild(...nodes) { for (const node of nodes) this.addChildAt(node, this.children.length); return nodes[0]; }
        addChildAt(node, index) {
            if (index < 0 || index > this.children.length) throw new RangeError('Invalid child index');
            node.parent?.removeChild(node);
            this.children.splice(index, 0, node); node.parent = this; node.emit('added', this); return node;
        }
        removeChild(node) {
            const index = this.children.indexOf(node);
            if (index >= 0) { this.children.splice(index, 1); node.parent = null; node.emit('removed', this); }
            return node;
        }
        removeChildAt(index) { return this.removeChild(this.children[index]); }
        removeChildren() { return [...this.children].map(node => this.removeChild(node)); }
        getChildIndex(node) { return this.children.indexOf(node); }
        setChildIndex(node, index) { this.removeChild(node); this.addChildAt(node, index); }
        on(event, fn) { const list = this._events.get(event) ?? []; list.push(fn); this._events.set(event, list); return this; }
        emit(event, ...args) { for (const fn of this._events.get(event) ?? []) fn.apply(this, args); }
        updateTransform() {
            const p = this.parent?.worldTransform ?? new Matrix();
            const a = Math.cos(this.rotation + this.skew.y) * this.scale.x;
            const b = Math.sin(this.rotation + this.skew.y) * this.scale.x;
            const c = -Math.sin(this.rotation - this.skew.x) * this.scale.y;
            const d = Math.cos(this.rotation - this.skew.x) * this.scale.y;
            const x = this.x - this.pivot.x * a - this.pivot.y * c;
            const y = this.y - this.pivot.x * b - this.pivot.y * d;
            Object.assign(this.worldTransform, {a: p.a * a + p.c * b, b: p.b * a + p.d * b,
                c: p.a * c + p.c * d, d: p.b * c + p.d * d,
                tx: p.a * x + p.c * y + p.tx, ty: p.b * x + p.d * y + p.ty});
            this.worldAlpha = (this.parent?.worldAlpha ?? 1) * this.alpha;
            for (const child of this.children) child.updateTransform();
        }
        destroy(options = {}) {
            this.parent?.removeChild(this);
            for (const child of this.removeChildren()) if (options.children) child.destroy(options);
            this._events.clear();
        }
    }
    class BaseTexture {
        constructor(source = null) { this.source = source; this.width = source?.width ?? 0; this.height = source?.height ?? 0; this.version = 0; this.scaleMode = 0; }
        update() { this.width = this.source?.width ?? this.width; this.height = this.source?.height ?? this.height; this.version++; }
        destroy() { this.source = null; this.version++; }
    }
    class Texture {
        constructor(baseTexture = new BaseTexture()) { this.baseTexture = baseTexture; this.frame = new Rectangle(0, 0, baseTexture.width, baseTexture.height); this._updateID = 0; }
        destroy() { this.baseTexture.destroy(); }
    }
    class Sprite extends Container {
        constructor(texture) { super(); Sprite.initialize(this, texture); }
        static initialize(node, texture) {
            Container.initialize(node); node.texture = texture; node.anchor = new Point(); node.blendMode = 0;
        }
    }
    class TilingSprite extends Sprite {
        constructor(texture) { super(texture); TilingSprite.initialize(this, texture); }
        static initialize(node, texture) { Sprite.initialize(node, texture); node.tilePosition = new Point(); node.tileScale = new Point(1, 1); node.isTiling = true; }
    }
    class Graphics extends Container {
        constructor() { super(); this.graphicsData = []; this.color = 0; this.fillAlpha = 1; }
        clear() { this.graphicsData.length = 0; return this; }
        beginFill(color, alpha = 1) { this.color = color; this.fillAlpha = alpha; return this; }
        drawRect(x, y, width, height) { this.graphicsData.push({shape: new Rectangle(x, y, width, height), color: this.color, alpha: this.fillAlpha}); return this; }
        endFill() { return this; }
    }
    // Retained tile commands are sent directly to WebGPU, without a canvas tile atlas.
    class TileSurface {
        constructor(width, height) { Object.assign(this, {width, height, commands: [], smooth: false}); }
        isReady() { return true; }
        addLoadListener(fn) { fn(this); }
        touch() {}
        checkDirty() {}
        clear() { this.commands.length = 0; }
        clearRect(x, y, w, h) { this.commands = this.commands.filter(c => c.x + c.w <= x || c.x >= x + w || c.y + c.h <= y || c.y >= y + h); }
        bltImage(source, sx, sy, sw, sh, x, y, w = sw, h = sh) { this.commands.push({source, sx, sy, sw, sh, x, y, w, h}); }
        fillRect(x, y, w, h) { this.commands.push({x, y, w, h, color: [0, 0, 0, 0.5]}); }
    }
    return {Point, Rectangle, Matrix, Container, BaseTexture, Texture, Sprite, Graphics, TileSurface,
        extras: {PictureTilingSprite: TilingSprite, TilingSprite}, SCALE_MODES: {NEAREST: 0, LINEAR: 1}};
})();

export {Render2D};
