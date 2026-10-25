import * as core from '../core/index.js';
import * as managers from './index.js';

//-----------------------------------------------------------------------------
// SceneManager
//
// The static class that manages scene transitions.
const SceneManager = {
    /*
     * Gets the current time in ms without on iOS Safari.
     * @private
     */
    _getTimeInMsWithoutMobileSafari() {
        return performance.now();
    },

    _scene: null,

    _nextScene: null,

    _stack: [],

    _stopped: false,

    _sceneStarted: false,

    _exiting: false,

    _previousClass: null,

    _backgroundBitmap: null,

    _screenWidth: 816,

    _screenHeight: 624,

    _boxWidth: 816,

    _boxHeight: 624,

    _deltaTime: 1.0 / 60.0,

    _accumulator: 0.0,

    _frameCount: 0,

    async run(sceneClass) {
        try {
            await this.initialize();
            this.goto(sceneClass);
            this.requestUpdate();
        } catch (e) {
            this.catchException(e);
        }
    },

    async initialize() {
        await managers.StorageManager.initialize();
        this.initProgressWatcher();
        await this.initGraphics();
        this.checkFileAccess();
        this.initAudio();
        this.initInput();
        this.initNwjs();
        this.checkPluginErrors();
        this.setupErrorHandlers();
    },

    initProgressWatcher() {
        core.ProgressWatcher.initialize();
    },

    async initGraphics() {
        var type = this.preferableRendererType();
        core.Graphics.initialize(this._screenWidth, this._screenHeight, type);
        await core.Graphics.ready;
        core.Graphics.boxWidth = this._boxWidth;
        core.Graphics.boxHeight = this._boxHeight;
        core.Graphics.setLoadingImage('img/system/Loading.png');
        if (core.Utils.isOptionValid('showfps')) {
            core.Graphics.showFps();
        }
        if (type === 'webgl') {
            this.checkWebGL();
        }
    },

    preferableRendererType: () => 'webgpu',

    shouldUseCanvasRenderer() {
        return core.Utils.isMobileDevice();
    },

    checkWebGL() {
        if (!core.Graphics.hasWebGL()) {
            throw new Error('Your browser does not support WebGL.');
        }
    },

    checkFileAccess() {
        if (!core.Utils.canReadGameFiles()) {
            throw new Error('Your browser does not allow to read local files.');
        }
    },

    initAudio() {
        var noAudio = core.Utils.isOptionValid('noaudio');
        if (!core.WebAudio.initialize(noAudio) && !noAudio) {
            throw new Error('Your browser does not support Web Audio API.');
        }
    },

    initInput() {
        core.Input.initialize();
        core.TouchInput.initialize();
    },

    initNwjs() {
        if (core.Utils.isNwjs()) {
            var gui = nw;
            var win = gui.Window.get();
            if (process.platform === 'darwin' && !win.menu) {
                var menubar = new gui.Menu({ type: 'menubar' });
                var option = { hideEdit: true, hideWindow: true };
                menubar.createMacBuiltin('Game', option);
                win.menu = menubar;
            }
        }
    },

    checkPluginErrors() {
        managers.PluginManager.checkErrors();
    },

    setupErrorHandlers() {
        window.addEventListener('error', this.onError.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    },

    frameCount() {
        return this._frameCount;
    },

    setFrameCount(frameCount) {
        this._frameCount = frameCount;
    },

    resetFrameCount() {
        this._frameCount = 0;
    },

    requestUpdate() {
        if (!this._stopped) {
            requestAnimationFrame(this.update.bind(this));
        }
    },

    update() {
        try {
            this.tickStart();
            if (core.Utils.isMobileSafari()) {
                this.updateInputData();
            }
            this.updateManagers();
            this.updateMain();
            this.tickEnd();
        } catch (e) {
            this.catchException(e);
        }
    },

    terminate() {
        window.close();
    },

    onError(e) {
        console.error(e.message);
        if (e.filename || e.lineno) {
            console.error(e.filename, e.lineno);
            try {
                this.stop();
                core.Graphics.printError('Error', e.message);
                managers.AudioManager.stopAll();
            } catch (e2) {
            }
        }
    },

    onKeyDown(event) {
        if (!event.ctrlKey && !event.altKey) {
            switch (event.keyCode) {
            case 116:   // F5
                if (core.Utils.isNwjs()) {
                    location.reload();
                }
                break;
            case 119:   // F8
                if (core.Utils.isNwjs() && core.Utils.isOptionValid('test')) {
                    nw.Window.get().showDevTools();
                }
                break;
            }
        }
    },

    catchException(e) {
        if (e instanceof Error) {
            core.Graphics.printError(e.name, e.message);
            core.Graphics.printErrorDetail(e);
            console.error(e.stack);
        } else {
            core.Graphics.printError('UnknownError', e);
        }
        managers.AudioManager.stopAll();
        this.stop();
    },

    tickStart() {
        core.Graphics.tickStart();
    },

    tickEnd() {
        core.Graphics.tickEnd();
    },

    updateInputData() {
        core.Input.update();
        core.TouchInput.update();
    },

    updateMain() {
        if (core.Utils.isMobileSafari()) {
            this.changeScene();
            this.updateScene();
        } else {
            var newTime = this._getTimeInMsWithoutMobileSafari();
            if (this._currentTime === undefined) { this._currentTime = newTime; }
            var fTime = (newTime - this._currentTime) / 1000;
            if (fTime > 0.25) { fTime = 0.25; }
            this._currentTime = newTime;
            this._accumulator += fTime;
            while (this._accumulator >= this._deltaTime) {
                this.updateInputData();
                this.changeScene();
                this.updateScene();
                this._accumulator -= this._deltaTime;
            }
        }
        this.renderScene();
        this.requestUpdate();
    },

    updateManagers() {
        managers.ImageManager.update();
    },

    changeScene() {
        if (this.isSceneChanging() && !this.isCurrentSceneBusy()) {
            if (this._scene) {
                this._scene.terminate();
                this._scene.detachReservation();
                this._previousClass = this._scene.constructor;
            }
            this._scene = this._nextScene;
            if (this._scene) {
                this._scene.attachReservation();
                this._scene.create();
                this._nextScene = null;
                this._sceneStarted = false;
                this.onSceneCreate();
            }
            if (this._exiting) {
                this.terminate();
            }
        }
    },

    updateScene() {
        if (this._scene) {
            if (!this._sceneStarted && this._scene.isReady()) {
                this._scene.start();
                this._sceneStarted = true;
                this.onSceneStart();
            }
            if (this.isCurrentSceneStarted()) {
                this.updateFrameCount();
                this._scene.update();
            }
        }
    },

    renderScene() {
        if (this.isCurrentSceneStarted()) {
            core.Graphics.render(this._scene);
        } else if (this._scene) {
            this.onSceneLoading();
        }
    },

    updateFrameCount() {
        this._frameCount++;
    },

    onSceneCreate() {
        core.Graphics.startLoading();
    },

    onSceneStart() {
        core.Graphics.endLoading();
    },

    onSceneLoading() {
        core.Graphics.updateLoading();
    },

    isSceneChanging() {
        return this._exiting || !!this._nextScene;
    },

    isCurrentSceneBusy() {
        return this._scene && this._scene.isBusy();
    },

    isCurrentSceneStarted() {
        return this._scene && this._sceneStarted;
    },

    isNextScene(sceneClass) {
        return this._nextScene && this._nextScene.constructor === sceneClass;
    },

    isPreviousScene(sceneClass) {
        return this._previousClass === sceneClass;
    },

    goto(sceneClass) {
        if (sceneClass) {
            this._nextScene = new sceneClass();
        }
        if (this._scene) {
            this._scene.stop();
        }
    },

    push(sceneClass) {
        this._stack.push(this._scene.constructor);
        this.goto(sceneClass);
    },

    pop() {
        if (this._stack.length > 0) {
            this.goto(this._stack.pop());
        } else {
            this.exit();
        }
    },

    exit() {
        this.goto(null);
        this._exiting = true;
    },

    clearStack() {
        this._stack = [];
    },

    stop() {
        this._stopped = true;
    },

    prepareNextScene() {
        this._nextScene.prepare.apply(this._nextScene, arguments);
    },

    snap() {
        return core.Bitmap.snap(this._scene);
    },

    snapForBackground() {
        this._backgroundBitmap = this.snap();
        this._backgroundBitmap.blur();
    },

    backgroundBitmap() {
        return this._backgroundBitmap;
    },

    resume() {
        this._stopped = false;
        this.requestUpdate();
        if (!core.Utils.isMobileSafari()) {
            this._currentTime = this._getTimeInMsWithoutMobileSafari();
            this._accumulator = 0;
        }
    },
};

if (!core.Utils.isMobileSafari()) SceneManager._currentTime = SceneManager._getTimeInMsWithoutMobileSafari();

export {SceneManager};
