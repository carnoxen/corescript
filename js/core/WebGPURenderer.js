import * as core from './index.js';

const WebGPUShader = `
struct Vertex {
    @location(0) position: vec2f, @location(1) uv: vec2f,
    @location(2) color: vec4f, @location(3) tone: vec4f,
    @location(4) blend: vec4f,
};
struct Fragment {
    @builtin(position) position: vec4f, @location(0) uv: vec2f,
    @location(1) color: vec4f, @location(2) tone: vec4f,
    @location(3) blend: vec4f,
};
@group(0) @binding(0) var imageSampler: sampler;
@group(0) @binding(1) var image: texture_2d<f32>;
@vertex fn vertex(v: Vertex) -> Fragment {
    var f: Fragment;
    f.position = vec4f(v.position, 0, 1); f.uv = v.uv;
    f.color = v.color; f.tone = v.tone; f.blend = v.blend;
    return f;
}
@fragment fn fragment(f: Fragment) -> @location(0) vec4f {
    let sample = textureSample(image, imageSampler, f.uv);
    let gray = dot(sample.rgb, vec3f(0.299, 0.587, 0.114));
    let toned = clamp(mix(sample.rgb, vec3f(gray), f.tone.a) + f.tone.rgb, vec3f(0), vec3f(1));
    let rgb = mix(toned, f.blend.rgb, f.blend.a) * f.color.rgb;
    let alpha = sample.a * f.color.a;
    return vec4f(rgb * alpha, alpha);
}`;

class WebGPURenderer {
    static async create(view, width, height) {
        if (!navigator.gpu) throw new Error('WebGPU is required. Open this game on localhost or HTTPS in a WebGPU browser.');
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error('No WebGPU adapter is available.');
        const device = await adapter.requestDevice();
        const renderer = new WebGPURenderer(device, view, width, height);
        const module = device.createShaderModule({code: WebGPUShader});
        const info = await module.getCompilationInfo();
        const errors = info.messages.filter(message => message.type === 'error');
        if (errors.length) throw new Error(errors.map(message => message.message).join('\n'));
        const blends = [
            {srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add'},
            {srcFactor: 'one', dstFactor: 'one', operation: 'add'},
            {srcFactor: 'dst', dstFactor: 'one-minus-src-alpha', operation: 'add'},
            {srcFactor: 'one', dstFactor: 'one-minus-src', operation: 'add'}
        ];
        renderer.pipelines = await Promise.all(blends.map(color => device.createRenderPipelineAsync({
            layout: renderer.layout,
            vertex: {module, entryPoint: 'vertex', buffers: [{arrayStride: 64, attributes: [
                {shaderLocation: 0, offset: 0, format: 'float32x2'},
                {shaderLocation: 1, offset: 8, format: 'float32x2'},
                {shaderLocation: 2, offset: 16, format: 'float32x4'},
                {shaderLocation: 3, offset: 32, format: 'float32x4'},
                {shaderLocation: 4, offset: 48, format: 'float32x4'}]}]},
            fragment: {module, entryPoint: 'fragment', targets: [{format: renderer.format,
                blend: {color, alpha: {srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add'}}}]},
            primitive: {topology: 'triangle-list'}
        })));
        return renderer;
    }
    constructor(device, view, width, height) {
        Object.assign(this, {device, view, width, height, textures: new Map(), frame: 0, type: 'webgpu'});
        this.context = view.getContext('webgpu');
        if (!this.context) throw new Error('Cannot create a WebGPU canvas context.');
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({device, format: this.format, alphaMode: 'opaque', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC});
        this.resize(width, height);
        this.bindLayout = device.createBindGroupLayout({entries: [
            {binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'filtering'}},
            {binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'float'}}
        ]});
        this.layout = device.createPipelineLayout({bindGroupLayouts: [this.bindLayout]});
        this.samplers = [false, true].map(linear => device.createSampler({magFilter: linear ? 'linear' : 'nearest', minFilter: linear ? 'linear' : 'nearest'}));
        this.white = device.createTexture({size: [1, 1], format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST});
        device.queue.writeTexture({texture: this.white}, new Uint8Array([255, 255, 255, 255]), {}, [1, 1]);
        this.whiteGroup = this.bindGroup(this.white, 0);
        this.textureGC = {run: () => this.collectTextures(true)};
        device.lost.then(info => { if (!this.destroyed) { this.error = new Error(`WebGPU device lost: ${info.message}. Reload the game.`); } });
        device.addEventListener('uncapturederror', event => { this.error = event.error; });
    }
    resize(width, height) { this.width = this.view.width = width; this.height = this.view.height = height; }
    bindGroup(texture, mode) { return this.device.createBindGroup({layout: this.bindLayout, entries: [
    {binding: 0, resource: this.samplers[mode]}, {binding: 1, resource: texture.createView()}]}); }
    texture(base) {
        const source = base?.source;
        if (!source || !source.width || !source.height) return null;
        let entry = this.textures.get(base);
        if (!entry || entry.width !== source.width || entry.height !== source.height) {
            entry?.texture.destroy();
            const texture = this.device.createTexture({size: [source.width, source.height], format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT});
            entry = {texture, width: source.width, height: source.height, version: -1,
                groups: [this.bindGroup(texture, 0), this.bindGroup(texture, 1)]};
            this.textures.set(base, entry);
        }
        if (entry.version !== base.version) {
            this.device.queue.copyExternalImageToTexture({source}, {texture: entry.texture, premultipliedAlpha: false}, [source.width, source.height]);
            entry.version = base.version;
        }
        entry.lastFrame = this.frame;
        return entry.groups[base.scaleMode === 1 ? 1 : 0];
    }
    collectTextures(all = false) {
        for (const [base, entry] of this.textures) if (all || this.frame - entry.lastFrame > 120) {
            entry.texture.destroy(); this.textures.delete(base);
        }
    }
    quad(node, rect, uv, group, color, tone, blend, clip, mode = node.blendMode ?? 0) {
        if (rect.width <= 0 || rect.height <= 0 || !group) return;
        const t = node.worldTransform;
        const first = this.vertices.length / 16;
        for (const [x, y] of [[0, 0], [1, 0], [0, 1], [0, 1], [1, 0], [1, 1]]) {
            const px = rect.x + x * rect.width, py = rect.y + y * rect.height;
            this.vertices.push((t.a * px + t.c * py + t.tx) / this.width * 2 - 1,
                1 - (t.b * px + t.d * py + t.ty) / this.height * 2,
                uv[0] + x * uv[2], uv[1] + y * uv[3], ...color, ...tone, ...blend);
        }
        const key = clip.join(',');
        const last = this.draws.at(-1);
        if (last && last.group === group && last.mode === mode && last.key === key) last.count += 6;
        else this.draws.push({first, count: 6, group, mode, clip, key});
    }
    sprite(node, tone, clip) {
        const bitmap = node.bitmap;
        if (bitmap && !bitmap.isReady()) return;
        bitmap?.touch(); bitmap?.checkDirty();
        const frame = node.texture.frame;
        const color = [1, 1, 1, node.worldAlpha];
        const blend = (node._blendColor ?? [0, 0, 0, 0]).map(v => v / 255);
        const localTone = node._colorTone ?? [0, 0, 0, 0];
        const combined = tone.map((v, i) => Math.max(i === 3 ? 0 : -1, Math.min(1, v + localTone[i] / 255)));
        if (bitmap instanceof core.Render2D.TileSurface) {
            for (const c of bitmap.commands) {
                const x = Math.max(c.x, frame.x), y = Math.max(c.y, frame.y);
                const w = Math.min(c.x + c.w, frame.x + frame.width) - x;
                const h = Math.min(c.y + c.h, frame.y + frame.height) - y;
                if (w <= 0 || h <= 0) continue;
                const base = c.source?.baseTexture;
                const uv = base ? [(c.sx + (x - c.x) * c.sw / c.w) / base.width,
                    (c.sy + (y - c.y) * c.sh / c.h) / base.height, w * c.sw / c.w / base.width, h * c.sh / c.h / base.height] : [0, 0, 1, 1];
                this.quad(node, {x: x - frame.x, y: y - frame.y, width: w, height: h}, uv,
                    base ? this.texture(base) : this.whiteGroup, c.color ? [1, 1, 1, c.color[3] * node.worldAlpha] : color,
                    combined, c.color ? [0, 0, 0, 1] : blend, clip);
            }
            return;
        }
        const base = node.texture.baseTexture, group = this.texture(base);
        if (!group || frame.width <= 0 || frame.height <= 0) return;
        const ax = node.anchor.x * frame.width, ay = node.anchor.y * frame.height;
        if (node.isTiling) {
            const sx = node.tileScale.x, sy = node.tileScale.y;
            if (sx <= 0 || sy <= 0) return;
            const tw = frame.width * sx, th = frame.height * sy;
            const ox = ((node.tilePosition.x % tw) + tw) % tw;
            const oy = ((node.tilePosition.y % th) + th) % th;
            for (let y = oy - th; y < node._height; y += th) for (let x = ox - tw; x < node._width; x += tw) {
                const left = Math.max(0, x), top = Math.max(0, y);
                const w = Math.min(node._width, x + tw) - left, h = Math.min(node._height, y + th) - top;
                this.quad(node, {x: left, y: top, width: w, height: h},
                    [(frame.x + (left - x) / sx) / base.width, (frame.y + (top - y) / sy) / base.height,
                        w / sx / base.width, h / sy / base.height], group, color, combined, blend, clip);
            }
        } else this.quad(node, {x: -ax, y: -ay, width: frame.width, height: frame.height},
            [frame.x / base.width, frame.y / base.height, frame.width / base.width, frame.height / base.height], group, color, combined, blend, clip);
    }
    visit(node, tone = [0, 0, 0, 0], clip = [0, 0, this.width, this.height]) {
        if (!node.visible || !node.renderable || node.worldAlpha <= 0) return;
        if (node._isWindowLayer) {
            const windows = node.children.filter(child => child._isWindow && child.visible && child.openness > 0);
            const bounds = this.bounds(node, 0, 0, node.width, node.height);
            for (let i = 0; i < windows.length; i++) {
                const window = windows[i];
                const rect = this.bounds(window, 0, window.height / 2 * (1 - window.openness / 255), window.width, window.height * window.openness / 255);
                let regions = [this.intersect(this.intersect(clip, bounds), rect)];
                for (const above of windows.slice(i + 1)) {
                    const mask = this.bounds(above, 0, above.height / 2 * (1 - above.openness / 255), above.width, above.height * above.openness / 255);
                    regions = regions.flatMap(region => this.subtract(region, mask));
                }
                for (const region of regions) if (region[2] && region[3]) this.visit(window, tone, region);
            }
            for (const child of node.children) if (!child._isWindow) this.visit(child, tone, clip);
            return;
        }
        for (const filter of node.filters ?? []) if (filter.enabled) tone = tone.map((v, i) => v + filter.tone[i]);
        if (node.texture) this.sprite(node, tone, clip);
        for (const data of node.graphicsData ?? []) {
            const {color, alpha, shape} = data;
            this.quad(node, shape, [0, 0, 1, 1], this.whiteGroup,
                [(color >> 16 & 255) / 255, (color >> 8 & 255) / 255, (color & 255) / 255, alpha * node.worldAlpha], tone, [0, 0, 0, 0], clip);
        }
        for (const child of node.children) this.visit(child, tone, clip);
    }
    bounds(node, x, y, width, height) {
        const points = [[x, y], [x + width, y], [x, y + height], [x + width, y + height]]
            .map(([x, y]) => node.worldTransform.apply({x, y}));
        const left = Math.max(0, Math.floor(Math.min(...points.map(p => p.x))));
        const top = Math.max(0, Math.floor(Math.min(...points.map(p => p.y))));
        const right = Math.min(this.width, Math.ceil(Math.max(...points.map(p => p.x))));
        const bottom = Math.min(this.height, Math.ceil(Math.max(...points.map(p => p.y))));
        return [left, top, Math.max(0, right - left), Math.max(0, bottom - top)];
    }
    intersect(a, b) {
        const x = Math.max(a[0], b[0]), y = Math.max(a[1], b[1]);
        return [x, y, Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - x), Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - y)];
    }
    subtract(a, b) {
        const [x, y, w, h] = this.intersect(a, b);
        if (!w || !h) return [a];
        return [[a[0], a[1], a[2], y - a[1]], [a[0], y + h, a[2], a[1] + a[3] - y - h],
            [a[0], y, x - a[0], h], [x + w, y, a[0] + a[2] - x - w, h]].filter(r => r[2] > 0 && r[3] > 0);
    }
    render(stage) {
        if (this.error) throw this.error;
        this.frame++; this.vertices = []; this.draws = [];
        stage.updateTransform(); this.visit(stage);
        const data = new Float32Array(this.vertices);
        if (!this.vertexBuffer || this.vertexBuffer.size < data.byteLength) {
            this.vertexBuffer?.destroy();
            this.vertexBuffer = this.device.createBuffer({size: Math.max(256, data.byteLength * 2), usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST});
        }
        if (data.length) this.device.queue.writeBuffer(this.vertexBuffer, 0, data);
        const encoder = this.device.createCommandEncoder();
        const pass = encoder.beginRenderPass({colorAttachments: [{view: this.context.getCurrentTexture().createView(),
            clearValue: {r: 0, g: 0, b: 0, a: 1}, loadOp: 'clear', storeOp: 'store'}]});
        pass.setVertexBuffer(0, this.vertexBuffer);
        for (const draw of this.draws) {
            if (draw.clip[2] <= 0 || draw.clip[3] <= 0) continue;
            pass.setPipeline(this.pipelines[draw.mode] ?? this.pipelines[0]);
            pass.setBindGroup(0, draw.group); pass.setScissorRect(...draw.clip); pass.draw(draw.count, 1, draw.first);
        }
        pass.end(); this.device.queue.submit([encoder.finish()]);
        if (this.frame % 120 === 0) this.collectTextures();
    }
    destroy() {
        this.destroyed = true; this.collectTextures(true); this.vertexBuffer?.destroy(); this.white.destroy();
        this.context.unconfigure(); this.device.destroy();
    }
    async readPixels() {
        const stride = Math.ceil(this.width * 4 / 256) * 256;
        const buffer = this.device.createBuffer({size: stride * this.height, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ});
        const encoder = this.device.createCommandEncoder();
        encoder.copyTextureToBuffer({texture: this.context.getCurrentTexture()}, {buffer, bytesPerRow: stride}, [this.width, this.height]);
        this.device.queue.submit([encoder.finish()]);
        await buffer.mapAsync(GPUMapMode.READ);
        const raw = new Uint8Array(buffer.getMappedRange()), pixels = new Uint8Array(this.width * this.height * 4);
        for (let y = 0; y < this.height; y++) pixels.set(raw.subarray(y * stride, y * stride + this.width * 4), y * this.width * 4);
        buffer.unmap(); buffer.destroy();
        if (this.format.startsWith('bgra')) for (let i = 0; i < pixels.length; i += 4) [pixels[i], pixels[i + 2]] = [pixels[i + 2], pixels[i]];
        return pixels;
    }
}

export {WebGPUShader, WebGPURenderer};
