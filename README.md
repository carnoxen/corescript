
# RPG Maker MV CoreScript

## Introduction

"RPG Maker MV CoreScript" is a game engine for 2D games that runs on the browser. "RPG Maker MV CoreScript" is designed as a game engine dedicated to "RPG Maker MV", the latest work of "RPG Maker" series of 2DRPG world number one software with more than 20 years history, and more than 1000 games are running. (February 2017)

## What is this project?

This project is a project aimed at improving "RPG Maker MV CoreScript" better by the community and supporting many game creators.

The core script developed by this project is widely distributed to RPG Maker users through KADOKAWA.
The RPGMaker MV community is centered around plugins. Therefore, Ver1 series is developed while minimizing destructive change.

## How to use

There are three releases

- Develop --- Development version. You can download it with GitHub.
- RC --- Release candidate version. It is for game developers to do the test. It will be distributed from game posting site "RPG Atsumaru".
- Stable --- Stable version. KADOKAWA is widely distributed to general users through Steam and official website.

## Build and run (WebGPU)

Requires Node.js 22+ and a browser with WebGPU enabled. No npm packages, CDN scripts,
PIXI, or third-party runtime libraries are required. No `npm install` step is needed.

```sh
npm test          # Build, copy to game/, run automated tests
npm start         # Serve game/ at http://localhost:8080/
npm run package  # Build corescript.zip, including source maps and integrity checks
```

Place an RPG Maker MV project's data/, img/, audio/, fonts/, and js/plugins.js in
`game/` before starting a game. This repository does not include game assets.
Serve games through localhost or HTTPS; WebGPU initialization must complete before
scenes start. Unsupported devices show an error instead of a blank fallback canvas.

```sh
npm run build    # dist/engine.js plus seven module entry points
npm run watch    # Watch sources, rebuild and copy changed bundles
node tools/tasks.js start .  # Serve the repository, including tests/webgpu.html
```

Open http://localhost:8080/tests/webgpu.html after the last command for a real GPU
pixel test of sprites, tones, blend colors, scrolling, tiles, and window skins.
`npm test` covers the scene graph, GPU draw commands, clipping, save protection,
archive generation, and syntax without requiring browser automation.

Rendering uses an in-repository WebGPU scene graph and WGSL shader. Sprites,
autotiles, windows, weather, fades, and normal/add/multiply/screen blending are
submitted to WebGPU. Canvas 2D remains for authoring text and bitmap assets and
for screen snapshots; it is not a scene renderer. Tile layers retain draw commands
rather than rasterizing a canvas atlas. Textures are cached and evicted after idle
frames. GPU device loss is reported with a reload instruction.

Instance types use ES classes with methods, accessors, and static fields inside
one declaration. Managers such as DataManager, Graphics, and AudioManager use
objects rather than non-instantiable functions. Inheritance uses `extends` and
`super`; public names and `initialize` hooks remain available for game logic,
save restoration, and plugins. Plugins that call class constructors as ordinary
functions need migration. Plugins that access
PIXI, WebGL internals, custom filters, or nonstandard blend modes need migration;
there is no PIXI compatibility shim.

The engine, build tools, and tests use ES modules (`import`/`export`, package type
`module`). Public entry points export short names; `engine` exports namespace objects with no API
assigned to the browser global. The ordered linker combines the cyclic source
modules into `dist/engine.js`; consume this module or the `core.js`, `managers.js`, `objects.js`, `scenes.js`, `sprites.js`, `windows.js`, and `sprites/sets.js` re-export
entry points after building. Individual `build:*` commands link the shared engine
as well. For example:

```js
import {core, managers, objects, scenes, sprites, windows, sets} from 'engine';
import {Actor} from 'objects';
import {Base} from 'windows';
managers.State.$gameVariables.setValue(1, 42);
core.JsonEx.register(MyPluginClass); // Register custom classes before loading old saves.
```

`importmap.json` is the single mapping of public module names to URLs. Build/copy
embeds it as an inline `<script type="importmap">` before the module entry point,
so browser imports can use `engine`, `core`, `managers`, `objects`, `scenes`,
`sprites`, `windows`, and `sets`. The same mapping is included in the release package.

The old JSON source lists are removed. Build discovers `.js` files in `js/core/`,
`js/managers/`, `js/objects/`, `js/scenes/`, `js/sprites/`, and `js/windows/` and
orders eager initialization dependencies, including base classes. Import maps
resolve module URLs; the linker handles initialization order separately.

Filenames omit category prefixes: `js/windows/Base.js`, `js/objects/Actor.js`,
`js/scenes/Boot.js`, and `js/sprites/Actor.js`. Sprite sets live in
`js/sprites/sets/` to distinguish them from individual sprites. Classes use short names inside each module: `objects.Actor`, `scenes.Boot`,
`windows.Base`, and `sets.Base`. Namespace objects distinguish equal names, so
`objects.Actor` and `sprites.Actor` are separate constructors. `GameState` is now
`managers.State` in `js/managers/State.js`. Public exports do not include the old
prefixed identifiers. New saves record qualified identities such as `objects.Actor`;
the serializer privately accepts old names when restoring existing saves.
Included plugins are now named `Basic`, `FailLoading`, `ReportMemory`,
`ThrottleImage`, and `HealthCheck`; use these names in plugin configuration.

Game data and save objects live in the exported `managers.State` object. JsonEx resolves
saved constructor names through its registry, not through `window`. Built-in
constructors are registered when the linked engine module initializes.

`index.html` loads only `js/main.js` with `type="module"`. Plugin configuration in
`js/plugins.js` must use `export default [...]` instead of declaring `$plugins`.
Each plugin exports a default installer that receives the engine exports:

```js
export default function install({core, managers, windows}) {
    const parameters = managers.PluginManager.parameters('MyPlugin');
    // Install hooks using core.Sprite, windows.Base, and managers.State.
}
```

Plugins install in configuration order before the game starts. Existing scripts
that depend on global engine names need this module format. The included plugins
have been migrated. Default empty configuration is created only when a project
does not already have `js/plugins.js`.

Desktop file storage loads Node
built-ins with dynamic `import()` during `StorageManager.initialize()`;
SceneManager awaits that initialization before starting the game. Browser storage
does not load Node modules. Desktop hosts must support ESM imports of Node built-ins.

Saves now use versioned, uncompressed UTF-8 JSON (`RPGJSON1` prefix). Legacy
LZString saves are rejected before backup or overwrite. Export old saves as JSON
using the original engine before importing them. Existing compressed saves are
not automatically converted; uncompressed saves may use more localStorage space.

## How to join

- This project uses English as the main language.
- The workflow is Github Flow. When sending PR, prepare a new feature branch and send it to the master branch of this repository.http://scottchacon.com/2011/08/31/github-flow.html
- Use modern JavaScript and platform APIs. Keep public game/plugin hooks compatible where practical.
- Please apply for development slack from this form. It will usually be invited within 48 hours.https://docs.google.com/forms/d/1T5wrKeOAfFBNytHrby4HMDzShtOMl2s7ayvjGwBrbNY/edit
- This project is just started. The rules of development are decided through discussion.

## Roadmap

Development will be done according to the roadmap. Currently we are developing ver 1.2

### ver 1.0

Goal: Publish community development version
- Split core script file
- Put on github
- Publish roadmap

### ver 1.1

Goal: Fix a fatal bug
- Fix memory related problems
- Preceding reading of image material
- Responding to sound problems of google Chrome
- Fixed bugs already known


### ver 1.2

Goal: Responding to problems where games can not continue
- Retry at load error
- Development of a standard plugin for options
- Volume Change API

### ver 1.3

Goal: Assist in game development
- AutoSave
- Simple conflict check for plugins
- Guidelines and sample writing for plugins
- Refined bug report

### ver 1.4

Goal: Accelerate speed, reduce experience time
- High-speed loading of sound source
- Progress bar on load screen
- Lightweight Save File

### ver 1.5

Goal: Improve UI
- Multilingual
- Multi-touch
- Battle system touch compliance
- Touch correspondence of basic system such as equipment

## Constitution
The core script is finally output to mainly 6 files.
<dl>
    <dt>core.js</dt>
    <dd>Wrapper classes of Pixi.js and base classes such as audio and input processing.</dd>
    <dt>managers.js</dt>
    <dd>Static classes named XxxManager that manage the game overall.</dd>
    <dt>objects.js</dt>
    <dd>Classes such as objects.Actor and objects.Party dealing with game data (many are saved).</dd>
    <dt>scenes.js</dt>
    <dd>Classes such as scenes.Boot and scenes.Map in which the scene is defined.</dd>
    <dt>sprites.js</dt>
    <dd>Classes such as sprites.Actor and sprites.Enemy related to image display and processing.</dd>
    <dt>windows.js</dt>
    <dd>Classes such as windows.Base and windows.Command handling window display and input.</dd>
</dl>

In addition, a plugin list is defined in *plugins.js*, and *main.js* launches the game.

## Inheritance style

```js
// In JavaScript this function is constructor
function Derived() {
    this.initialize.apply(this, arguments); // Delegate to initialize()
}

Derived.prototype = Object.create(Base.prototype); // Derived inherits from Base
Derived.prototype.constructor = Derived;

Derived.prototype.initialize = function () {
    Base.prototype.initialize.call(this); // This makes super.initialize() sense
};
```

## Global variables
Variables named `$dataXxx` are read from JSON in the *data* folder.
These files are changed by the editor, but they are immutable during play.
Variables named `$gameXxx` are instances of the class defined in *objects.js*.
When saving the game, these objects (except `$gameTemp, $gameMessage, $gameTroop`) are serialized to JSON and saved.
When loading, since the prototype chain is reconnected simultaneously with deserialization, you can continue using instance methods.

## Scene graph
The scene graph is a drawing tree like FLASH provided by Pixi.js.
Children are influenced by parent's coordinates and visibility.
Register a child in the form `(scene or sprite or window).addChild(child)`.

### Scene
In RMMV the scene is the root element of the scene graph and has children with Sprite and Window.
The life cycle is managed by `SceneManager`, and it operates up to one at the same time.

Life cycle: `new scenes.Example() -> create() -> start() -> update()* -> stop() -> terminate()`

## Flow

### Initialization
1. When the page is loaded, call `SceneManager.run()`. *(main.js)*
1. Initialize classes such as `Graphics, WebAudio, Input, TouchInput`.
1. Set `scenes.Boot` to `managers.SceneManager`.
1. Register `SceneManager.update` in `requestAnimationFrame`.

`requestAnimationFrame` is called by the browser at regular time intervals (every time drawing is required).

### Update
1. `requestAnimationFrame` calls `SceneManager.update()`.
1. Process the current scene every 1/60 second according to the scene lifecycle rule
1. If `scenes.Example.update()` is called, then
    1. Call all children `update()`.
    1. Children recursively call their children `update()`.
1. Render the scene (including its children) onto the screen.
1. Register `SceneManager.update` in `requestAnimationFrame`.


## License
This content is released under the (http://opensource.org/licenses/MIT) MIT License.
