import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crc32 from '../tools/crc32.js';
import {modules, readLayout, importMap} from '../tools/layout.js';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {linkSource, linkModule} from '../concat.js';

const layout = readLayout();
const coreFiles = layout.groups.find(group => group.name === 'core').files;
const manifest = name => layout.groups.find(group => group.name === name).files;

function runtime(files) {
    const data = new Map();
    const paint = new Proxy({}, {get: (target, key) => key in target ? target[key] :
        key === 'measureText' ? text => ({width: String(text).length * 10}) :
        key === 'getImageData' ? () => ({data: new Uint8ClampedArray(4)}) : () => {}});
    const context = vm.createContext({console, performance, setTimeout, clearTimeout,
        navigator: {userAgent: 'test'}, location: {search: ''}, document: {fonts: {},
        createElement: () => ({width: 1, height: 1, style: {}, getContext: () => paint})},
        Utils: {isNwjs: () => false}, localStorage: {
            getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key)
        }});
    context.window = context;
    vm.runInContext(`const ${modules.map(name => name + ' = {}').join(', ')}; core.Utils = {isNwjs: () => false};`, context);
    for (const name of modules) context[name] = vm.runInContext(name, context);
    for (const file of files) {
        const group = layout.groups.find(group => group.files.includes(file));
        vm.runInContext(linkModule(fs.readFileSync(file, 'utf8'), group.name), context, {filename: file});
    }
    if (context.core.JsonEx) for (const name of modules) {
        const legacy = {objects: 'Game_', scenes: 'Scene_', sprites: 'Sprite_', windows: 'Window_', sets: 'Spriteset_'};
        context.core.JsonEx.registerNamespace(name, context[name], legacy[name] ?? '');
    }
    context.api = Object.fromEntries(modules.map(name => [name, context[name]]));
    return {context, data, run: source => vm.runInContext(source, context)};
}

test('scene graph composes transforms, reparents, and propagates opacity', () => {
    const {run} = runtime(['js/core/Render2D.js']);
    assert.deepEqual([...run(`(() => {
        const root = new core.Render2D.Container(), child = new core.Render2D.Container();
        root.position.set(10, 20); root.scale.set(2); root.alpha = 0.5;
        child.position.set(3, 4); root.addChild(child); root.updateTransform();
        const result = [child.worldTransform.tx, child.worldTransform.ty, child.worldAlpha];
        const other = new core.Render2D.Container(); other.addChild(child);
        return [...result, root.children.length, child.parent === other];
    })()`)], [16, 28, 0.5, 0, true]);
});

test('save, backup, restore, Unicode, and legacy save protection', () => {
    const {run, data} = runtime(['js/core/SaveCodec.js', 'js/managers/StorageManager.js']);
    run(`managers.StorageManager.webStorageKey = id => 'save-' + id;
        managers.StorageManager.save(1, '{"name":"한글 🎮"}'); managers.StorageManager.backup(1);
        managers.StorageManager.save(1, '{"name":"changed"}'); managers.StorageManager.restoreBackup(1);`);
    assert.equal(run("managers.StorageManager.load(1)"), '{"name":"한글 🎮"}');
    data.set('save-1', 'legacy-compressed');
    assert.throws(() => run(`managers.StorageManager.save(1, '{}')`), /Legacy compressed/);
    assert.equal(data.get('save-1'), 'legacy-compressed');
    assert.throws(() => run("managers.StorageManager.backup(1)"), /Legacy compressed/);
    assert.equal(data.get('save-1'), 'legacy-compressed');
});

test('failed legacy backup does not delete the original game save', () => {
    const {context, run} = runtime(['js/managers/DataManager.js']);
    context.console = {error() {}};
    let removed = false;
    context.managers.StorageManager = {backup() { throw new Error('Legacy compressed'); }, remove() { removed = true; }};
    assert.equal(run("managers.DataManager.saveGame(1)"), false);
    assert.equal(removed, false);
});

test('tile surfaces retain tiles outside the repainted cell', () => {
    const {run} = runtime(['js/core/Render2D.js']);
    assert.equal(run(`(() => {
        const surface = new core.Render2D.TileSurface(96, 48);
        surface.bltImage({}, 0, 0, 48, 48, 0, 0);
        surface.bltImage({}, 0, 0, 48, 48, 48, 0);
        surface.clearRect(0, 0, 48, 48);
        return surface.commands.length === 1 && surface.commands[0].x === 48;
    })()`), true);
});

test('window clipping subtracts overlaps without drawing a region twice', () => {
    const {run} = runtime(['js/core/WebGPURenderer.js']);
    assert.deepEqual(JSON.parse(run(`JSON.stringify(core.WebGPURenderer.prototype.subtract([0, 0, 100, 100], [20, 20, 60, 60]))`)),
        [[0, 0, 100, 20], [0, 80, 100, 20], [0, 20, 20, 60], [80, 20, 20, 60]]);
});

test('CRC32 matches the standard check vector', () => {
    assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926);
});

test('all bundles parse and the core loads without third-party globals', () => {
    for (const name of modules) {
        const files = manifest(name);
        new vm.Script(files.map(file => linkSource(fs.readFileSync(file, 'utf8'))).join('\n'), {filename: name});
    }
    const {run} = runtime(coreFiles);
    assert.equal(run(`typeof PIXI === 'undefined' && typeof LZString === 'undefined' && typeof core.WebGPURenderer === 'function'`), true);
});

test('real sprites, windows, tilemaps and filters produce finite GPU vertices', () => {
    const {context, run} = runtime(coreFiles);
    const paint = new Proxy({}, {get(target, key) {
        if (key in target) return target[key];
        if (key === 'getImageData') return () => ({data: new Uint8ClampedArray(4)});
        if (key === 'createLinearGradient') return () => ({addColorStop() {}});
        return () => {};
    }});
    context.document.createElement = () => ({width: 1, height: 1, style: {}, getContext: () => paint});
    assert.equal(run(`(() => {
        core.Graphics._width = 128; core.Graphics._height = 128;
        const stage = new core.Stage(), bitmap = new core.Bitmap(192, 192);
        bitmap.fillAll('#fff');
        const sprite = new core.Sprite(bitmap); sprite.anchor.set(0.5); sprite.scale.set(2); sprite.rotation = 0.3;
        const tone = new core.ToneFilter(); tone.adjustTone(40, -30, 10); sprite.filters = [tone]; stage.addChild(sprite);
        const tiling = new core.TilingSprite(bitmap); tiling.move(10, 10, 40, 40); stage.addChild(tiling);
        const layer = new core.WindowLayer(); layer.move(0, 0, 128, 128);
        const window = new core.Window(); window.move(0, 0, 80, 80); window.windowskin = bitmap; layer.addChild(window); stage.addChild(layer);
        const map = new core.ShaderTilemap(); map.bitmaps[5] = bitmap; map.setData(1, 1, [1, 0, 0, 0, 0, 0]); map.update(); stage.addChild(map);
        const renderer = Object.create(core.WebGPURenderer.prototype);
        Object.assign(renderer, {width: 128, height: 128, vertices: [], draws: [], whiteGroup: {}, texture: base => base?.source ? base : null});
        stage.updateTransform(); renderer.visit(stage);
        if (!renderer.vertices.every(Number.isFinite)) throw new Error('Non-finite GPU vertex');
        if (!map._lowerBitmap.commands.length) throw new Error('No tile commands');
        return renderer.vertices.length >= 5 * 6 * 16;
    })()`), true);
});

test('unsupported WebGPU rejects initialization with a useful error', async () => {
    const {run} = runtime(['js/core/WebGPURenderer.js']);
    await assert.rejects(run("core.WebGPURenderer.create({}, 128, 128)"), /WebGPU is required/);
});

const engineFiles = layout.files;

test('all engine classes and manager objects load in bundle order', () => {
    const {run} = runtime(engineFiles);
    assert.equal(run(`[core.Graphics, core.Input, managers.AudioManager, managers.DataManager, core.JsonEx].every(name =>
        typeof name === 'object')`), true);
    assert.equal(run(`[objects.Actor, scenes.Boot, windows.Command].every(name =>
        Function.prototype.toString.call(name).startsWith('class '))`), true);
    run("managers.ConfigManager.bgmVolume = 37");
    assert.equal(run("managers.AudioManager.bgmVolume"), 37);
    assert.equal(run("managers.ImageManager.cache.manager === managers.ImageManager && managers.ImageManager.cache === managers.ImageManager.cache"), true);
});

test('derived initialization runs once and class getters survive save restoration', () => {
    const {run} = runtime(engineFiles);
    assert.equal(run(`(() => {
        let calls = 0;
        class Result extends objects.ActionResult {
            initialize() { super.initialize(); calls++; }
        }
        const result = new Result();
        const action = new objects.ActionResult();
        const saved = {a: action, b: action}; saved.self = saved;
        const restored = core.JsonEx.parse(core.JsonEx.stringify(saved));
        const scene = new scenes.Boot();
        const battler = new objects.Battler(); battler._hp = 12;
        return calls === 1 && result.used === false && restored.a instanceof objects.ActionResult &&
            restored.a === restored.b && restored.self === restored && battler.hp === 12 &&
            scene instanceof core.Stage && scene.children.length === 0 && scene._startDate > 0;
    })()`), true);
});

test('game object creation initializes inherited characters and party state', () => {
    const {run} = runtime(engineFiles);
    assert.equal(run(`(() => {
        const vehicle = {startMapId: 1, startX: 2, startY: 3, characterName: '', characterIndex: 0};
        managers.State.$dataSystem = {boat: vehicle, ship: vehicle, airship: vehicle,
            optFollowers: true, optTransparent: false};
        managers.DataManager.createGameObjects();
        managers.State.$gameParty.gainGold(100);
        const restored = core.JsonEx.parse(core.JsonEx.stringify(managers.DataManager.makeSaveContents()));
        return managers.State.$gameParty.gold() === 100 && managers.State.$gameMap.boat() instanceof objects.Vehicle &&
            managers.State.$gamePlayer.followers().follower(0) instanceof objects.Follower &&
            restored.player instanceof objects.Player && restored.party.gold() === 100;
    })()`), true);
});

test('command windows preserve overridden methods and inherited initialization', () => {
    const {run} = runtime(engineFiles);
    assert.equal(run(`(() => {
        core.Graphics._width = 816; core.Graphics._height = 624;
        const skin = new core.Bitmap(192, 192);
        managers.ImageManager.loadSystem = () => skin;
        managers.State.$dataSystem = {locale: 'en', windowTone: [0, 0, 0]};
        managers.State.$gameSystem = new objects.System();
        class Command extends windows.Command {
            makeCommandList() { this.addCommand('Test', 'test'); }
        }
        const window = new Command(10, 20);
        return window instanceof core.Window && window.x === 10 && window.y === 20 &&
            window.maxItems() === 1 && window.currentSymbol() === 'test' && !!window.contents;
    })()`), true);
});

test('local saves load Node built-ins through import and preserve backup round trips', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'corescript-save-'));
    try {
        const {managers} = await nativeEngine();
        const storage = {...managers.StorageManager, isLocalMode: () => true, localFileDirectoryPath: () => directory + path.sep};
        await storage.initialize();
        storage.localFilePath = id => path.join(directory, `${id}.rpgsave`);
        storage.save(1, '{"name":"테스트 🎮"}'); storage.backup(1);
        storage.save(1, '{}'); storage.restoreBackup(1);
        assert.equal(storage.load(1), '{"name":"테스트 🎮"}');
        assert.equal(storage.backupExists(1), false);
    } finally { fs.rmSync(directory, {recursive: true, force: true}); }
});

test('runtime and tooling contain no CommonJS loader or split constructor definitions', () => {
    for (const file of [...engineFiles, 'concat.js', 'copy-all.js', 'watch.js', 'tools/tasks.js',
        'tools/crc32.js', 'healthcheck/generate_crc.js', 'healthcheck/HealthCheck.js']) {
        const source = fs.readFileSync(file, 'utf8');
        assert.doesNotMatch(source, /\brequire\s*\(|\bmodule\.exports\b/, file);
        assert.doesNotMatch(source, /globalThis\s*[.[]/, file);
        if (engineFiles.includes(file)) {
            assert.doesNotMatch(source, /^function\s+[A-Z]\w*\s*\(/m, file);
            assert.doesNotMatch(source, /^\w+\.prototype\s*=\s*Object\.create/m, file);
        }
    }
});

let moduleId = 0;
async function nativeEngine() {
    const browser = `
        const hostWindow = {};
        const window = hostWindow, navigator = {userAgent: 'test'}, location = {search: ''};
        const paint = new Proxy({}, {get: (_, key) => key === 'measureText' ? () => ({width: 10}) : () => {}});
        const document = {fonts: {}, baseURI: 'http://localhost/index.html',
            createElement: () => ({width: 1, height: 1, style: {}, getContext: () => paint})};
        class XMLHttpRequest {
            status = 200;
            open(_, url) { hostWindow.requestURL = url; }
            overrideMimeType() {}
            send() { this.responseText = JSON.stringify(hostWindow.payload); this.onload(); }
        }
        export {hostWindow};
    `;
    const source = browser + fs.readFileSync('dist/engine.js', 'utf8') + `\n// instance ${moduleId++}`;
    try {
        return await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
    } catch (error) {
        error.stack = error.stack?.replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g, 'engine-test-module');
        throw error;
    }
}

test('native ESM exposes named exports without publishing browser globals', async () => {
    const engine = await nativeEngine();
    assert.equal(typeof engine.core.Sprite, 'function');
    assert.equal(typeof engine.managers.SceneManager, 'object');
    assert.equal(typeof engine.managers.State, 'object');
    for (const name of modules) for (const key of Object.keys(engine[name])) {
        assert.doesNotMatch(key, /^(Game_|Scene_|Sprite_|Spriteset_|Window_)/);
    }
    assert.equal(engine.hostWindow.Sprite, undefined);
    assert.equal(engine.hostWindow.State, undefined);
    assert.throws(() => { engine.core.Sprite = null; }, TypeError);
    engine.hostWindow.payload = [{id: 1, note: '<tag:yes>'}];
    engine.managers.DataManager.loadDataFile('$dataActors', 'Actors.json');
    assert.equal(engine.managers.State.$dataActors[0].meta.tag, 'yes');
    assert.equal(engine.hostWindow.requestURL, 'data/Actors.json');
});

test('a fresh native module restores classes from its own constructor registry', async () => {
    const first = await nativeEngine(), second = await nativeEngine();
    const original = new first.objects.ActionResult();
    original.used = true;
    const saved = first.core.JsonEx.stringify({a: original, b: original});
    const restored = second.core.JsonEx.parse(saved);
    assert.ok(restored.a instanceof second.objects.ActionResult);
    assert.equal(restored.a instanceof first.objects.ActionResult, false);
    assert.equal(restored.a.used, true);
    assert.equal(restored.a, restored.b);
});

test('equal short class names remain distinct and legacy save names still restore', async () => {
    const {core, objects, scenes, sprites, windows, sets} = await nativeEngine();
    const types = [objects.Actor, sprites.Actor, scenes.Base, sprites.Base, windows.Base, sets.Base,
        objects.Map, scenes.Map, sets.Map];
    const values = types.map((type, marker) => Object.assign(Object.create(type.prototype), {marker}));
    const saved = core.JsonEx.stringify({values});
    const restored = core.JsonEx.parse(saved);
    for (let i = 0; i < types.length; i++) {
        assert.equal(restored.values[i].constructor, types[i]);
        assert.equal(restored.values[i].marker, i);
        assert.doesNotMatch(types[i].name, /^(Game_|Scene_|Sprite_|Spriteset_|Window_)/);
    }
    assert.match(saved, /objects\.Actor/);
    assert.match(saved, /sprites\.Actor/);
    const legacy = core.JsonEx.parse('{"@":"Game_ActionResult","@c":1,"used":true}');
    assert.ok(legacy instanceof objects.ActionResult);
    assert.equal(legacy.used, true);
});

test('ES module plugins install sequentially and report import failures', async () => {
    const engine = await nativeEngine();
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'corescript-plugins-'));
    try {
        fs.writeFileSync(path.join(directory, 'package.json'), '{"type":"module"}');
        fs.writeFileSync(path.join(directory, 'first.js'), `export default async api => { await Promise.resolve(); api.order.push('first'); };`);
        fs.writeFileSync(path.join(directory, 'second.js'), `export default api => api.order.push('second');`);
        fs.writeFileSync(path.join(directory, 'invalid.js'), 'export default 0;');
        const runtime = {order: []};
        const manager = engine.managers.PluginManager;
        manager._path = pathToFileURL(directory + path.sep).href;
        await manager.setup([
            {name: 'first', status: true, parameters: {speed: 3}},
            {name: 'disabled', status: false, parameters: {}},
            {name: 'second', status: true, parameters: {}},
            {name: 'first', status: true, parameters: {speed: 9}}
        ], runtime);
        assert.deepEqual(runtime.order, ['first', 'second']);
        assert.equal(manager.parameters('FIRST').speed, 3);
        await assert.rejects(manager.loadScript('invalid.js', runtime), /default installer/);
        assert.throws(() => manager.checkErrors(), /Failed to load/);
    } finally { fs.rmSync(directory, {recursive: true, force: true}); }
});

test('the shipped import map resolves every public module before startup', () => {
    const html = fs.readFileSync('game/index.html', 'utf8');
    const match = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
    assert.ok(match);
    assert.deepEqual(JSON.parse(match[1]), importMap);
    assert.ok(match.index < html.indexOf('<script type="module"'));
    assert.match(fs.readFileSync('game/js/main.js', 'utf8'), /from 'engine'/);
    for (const [name, target] of Object.entries(importMap.imports)) {
        assert.ok(fs.existsSync(path.join('game', target)), `${name} resolves to ${target}`);
        if (name !== 'engine') {
            const file = path.join('game', target);
            const dependency = fs.readFileSync(file, 'utf8').match(/from '([^']+)'/)[1];
            assert.equal(path.resolve(path.dirname(file), dependency), path.resolve('game/js/engine.js'));
        }
    }
});

test('source imports resolve after removing filename prefixes and JSON manifests', () => {
    for (const group of ['core', 'managers', 'objects', 'scenes', 'sprites', 'windows']) {
        assert.equal(fs.existsSync(`rpg_${group}.json`), false);
    }
    assert.equal(fs.existsSync('modules.json'), false);
    for (const file of layout.files) {
        assert.doesNotMatch(path.basename(file), /^(Window_|Game_|Scene_|Sprite_|Spriteset_)/);
        const source = fs.readFileSync(file, 'utf8');
        for (const match of source.matchAll(/^import[^\n]*from '([^']+)'/gm)) {
            if (match[1].startsWith('.')) assert.ok(fs.existsSync(path.resolve(path.dirname(file), match[1])), `${file}: ${match[1]}`);
        }
    }
    assert.ok(layout.files.includes('js/windows/Base.js'));
    assert.ok(layout.files.includes('js/sprites/Base.js'));
    assert.ok(layout.files.includes('js/sprites/sets/Base.js'));
    assert.equal(fs.readdirSync('game/js').some(name => /^rpg_/.test(name)), false);
});
