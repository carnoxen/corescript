import * as core from './index.js';
import * as managers from '../managers/index.js';

//-----------------------------------------------------------------------------
/**
 * The static class that carries out graphics processing.
 *
 * @class Graphics
 */
const Graphics = {
    _cssFontLoading: document.fonts && document.fonts.ready && document.fonts.ready.then,

    _fontLoaded: null,

    _videoVolume: 1,

    /**
     * Initializes the graphics system.
     *
     * @static
     * @method initialize
     * @param {Number} width The width of the game screen
     * @param {Number} height The height of the game screen
     * @param {String} type The type of the renderer.
     *                 'canvas', 'webgl', or 'auto'.
     */
    initialize(width, height, type) {
        this._width = width || 800;
        this._height = height || 600;
        this._rendererType = 'webgpu';
        this._boxWidth = this._width;
        this._boxHeight = this._height;

        this._scale = 1;
        this._realScale = 1;

        this._errorShowed = false;
        this._errorPrinter = null;
        this._canvas = null;
        this._video = null;
        this._videoUnlocked = false;
        this._videoLoading = false;
        this._upperCanvas = null;
        this._renderer = null;
        this._fpsMeter = null;
        this._modeBox = null;
        this._skipCount = 0;
        this._maxSkip = 3;
        this._rendered = false;
        this._loadingImage = null;
        this._loadingCount = 0;
        this._fpsMeterToggled = false;
        this._stretchEnabled = this._defaultStretchMode();

        this._canUseDifferenceBlend = false;
        this._canUseSaturationBlend = false;
        this._hiddenCanvas = null;

        this._testCanvasBlendModes();
        this._modifyExistingElements();
        this._updateRealScale();
        this._createAllElements();
        this._disableTextSelection();
        this._disableContextMenu();
        this._setupEventHandlers();
        this._setupCssFontLoading();
        this._setupProgress();
    },

    _setupCssFontLoading() {
        if(Graphics._cssFontLoading){
            document.fonts.ready.then(function(fonts){
                Graphics._fontLoaded = fonts;
            }).catch(function(error){
                managers.SceneManager.onError(error);
            });
        }
    },

    canUseCssFontLoading() {
        return !!this._cssFontLoading;
    },

    /**
     * The total frame count of the game screen.
     *
     * @static
     * @property frameCount
     * @type Number
     */
    frameCount: 0,

    /**
     * The alias of Render2D.blendModes.NORMAL.
     *
     * @static
     * @property BLEND_NORMAL
     * @type Number
     * @final
     */
    BLEND_NORMAL: 0,

    /**
     * The alias of Render2D.blendModes.ADD.
     *
     * @static
     * @property BLEND_ADD
     * @type Number
     * @final
     */
    BLEND_ADD: 1,

    /**
     * The alias of Render2D.blendModes.MULTIPLY.
     *
     * @static
     * @property BLEND_MULTIPLY
     * @type Number
     * @final
     */
    BLEND_MULTIPLY: 2,

    /**
     * The alias of Render2D.blendModes.SCREEN.
     *
     * @static
     * @property BLEND_SCREEN
     * @type Number
     * @final
     */
    BLEND_SCREEN: 3,

    /**
     * Marks the beginning of each frame for FPSMeter.
     *
     * @static
     * @method tickStart
     */
    tickStart() {
        if (this._fpsMeter) {
            this._fpsMeter.tickStart();
        }
    },

    /**
     * Marks the end of each frame for FPSMeter.
     *
     * @static
     * @method tickEnd
     */
    tickEnd() {
        if (this._fpsMeter && this._rendered) {
            this._fpsMeter.tick();
        }
    },

    /**
     * Renders the stage to the game screen.
     *
     * @static
     * @method render
     * @param {Stage} stage The stage object to be rendered
     */
    render(stage) {
        if (this._skipCount <= 0) {
            var startTime = Date.now();
            if (stage) {
                this._renderer.render(stage);
                if (this._renderer.gl && this._renderer.gl.flush) {
                    this._renderer.gl.flush();
                }
            }
            var endTime = Date.now();
            var elapsed = endTime - startTime;
            this._skipCount = Math.min(Math.floor(elapsed / 15), this._maxSkip);
            this._rendered = true;
        } else {
            this._skipCount--;
            this._rendered = false;
        }
        this.frameCount++;
    },

    /**
     * Checks whether the renderer type is WebGL.
     *
     * @static
     * @method isWebGL
     * @return {Boolean} True if the renderer type is WebGL
     */
    isWebGL() {
        return !!this._renderer;
    },

    /**
     * Checks whether the current browser supports WebGL.
     *
     * @static
     * @method hasWebGL
     * @return {Boolean} True if the current browser supports WebGL.
     */
    hasWebGPU: () => !!navigator.gpu,

    // Compatibility for engine/plugin feature checks: WebGPU is the accelerated path.
    hasWebGL() { return this.hasWebGPU(); },

    isWebGPU: () => Graphics._renderer?.type === 'webgpu',

    /**
     * Checks whether the canvas blend mode 'difference' is supported.
     *
     * @static
     * @method canUseDifferenceBlend
     * @return {Boolean} True if the canvas blend mode 'difference' is supported
     */
    canUseDifferenceBlend() {
        return this._canUseDifferenceBlend;
    },

    /**
     * Checks whether the canvas blend mode 'saturation' is supported.
     *
     * @static
     * @method canUseSaturationBlend
     * @return {Boolean} True if the canvas blend mode 'saturation' is supported
     */
    canUseSaturationBlend() {
        return this._canUseSaturationBlend;
    },

    /**
     * Sets the source of the "Now Loading" image.
     *
     * @static
     * @method setLoadingImage
     */
    setLoadingImage(src) {
        this._loadingImage = new Image();
        this._loadingImage.src = src;
    },

    /**
     * Sets whether the progress bar is enabled.
     *
     * @static
     * @method setEnableProgress
     */
    setProgressEnabled(enable) {
        this._progressEnabled = enable;
    },

    /**
     * Initializes the counter for displaying the "Now Loading" image.
     *
     * @static
     * @method startLoading
     */
    startLoading() {
        this._loadingCount = 0;

        core.ProgressWatcher.truncateProgress();
        core.ProgressWatcher.setProgressListener(this._updateProgressCount.bind(this));
        this._progressTimeout = setTimeout(function() {
            Graphics._showProgress();
        }, 1500);
    },

    _setupProgress() {
        this._progressElement = document.createElement('div');
        this._progressElement.id = 'loading-progress';
        this._progressElement.width = 600;
        this._progressElement.height = 300;
        this._progressElement.style.visibility = 'hidden';

        this._barElement = document.createElement('div');
        this._barElement.id = 'loading-bar';
        this._barElement.style.width = '100%';
        this._barElement.style.height = '10%';
        this._barElement.style.background = 'linear-gradient(to top, gray, lightgray)';
        this._barElement.style.border = '5px solid white';
        this._barElement.style.borderRadius = '15px';
        this._barElement.style.marginTop = '40%';

        this._filledBarElement = document.createElement('div');
        this._filledBarElement.id = 'loading-filled-bar';
        this._filledBarElement.style.width = '0%';
        this._filledBarElement.style.height = '100%';
        this._filledBarElement.style.background = 'linear-gradient(to top, lime, honeydew)';
        this._filledBarElement.style.borderRadius = '10px';

        this._progressElement.appendChild(this._barElement);
        this._barElement.appendChild(this._filledBarElement);
        this._updateProgress();

        document.body.appendChild(this._progressElement);
    },

    _showProgress() {
        if (this._progressEnabled) {
            this._progressElement.value = 0;
            this._progressElement.style.visibility = 'visible';
            this._progressElement.style.zIndex = 98;
        }
    },

    _hideProgress() {
        this._progressElement.style.visibility = 'hidden';
        clearTimeout(this._progressTimeout);
    },

    _updateProgressCount(countLoaded, countLoading) {
        var progressValue;
        if(countLoading !== 0){
            progressValue = (countLoaded/countLoading) * 100;
        }else{
            progressValue = 100;
        }

        this._filledBarElement.style.width = progressValue + '%';
    },

    _updateProgress() {
        this._centerElement(this._progressElement);
    },

    /**
     * Increments the loading counter and displays the "Now Loading" image if necessary.
     *
     * @static
     * @method updateLoading
     */
    updateLoading() {
        this._loadingCount++;
        this._paintUpperCanvas();
        this._upperCanvas.style.opacity = 1;
        this._updateProgress();
    },

    /**
     * Erases the "Now Loading" image.
     *
     * @static
     * @method endLoading
     */
    endLoading() {
        this._clearUpperCanvas();
        this._upperCanvas.style.opacity = 0;
        this._hideProgress();
    },

    /**
     * Displays the loading error text to the screen.
     *
     * @static
     * @method printLoadingError
     * @param {String} url The url of the resource failed to load
     */
    printLoadingError(url) {
        if (this._errorPrinter && !this._errorShowed) {
            this._updateErrorPrinter();
            this._errorPrinter.innerHTML = this._makeErrorHtml('Loading Error', 'Failed to load: ' + url);
            this._errorPrinter.style.userSelect       = 'text';
            this._errorPrinter.style.webkitUserSelect = 'text';
            this._errorPrinter.style.msUserSelect     = 'text';
            this._errorPrinter.style.mozUserSelect    = 'text';
            this._errorPrinter.oncontextmenu = null;    // enable context menu
            var button = document.createElement('button');
            button.innerHTML = 'Retry';
            button.style.fontSize = '24px';
            button.style.color = '#ffffff';
            button.style.backgroundColor = '#000000';
            button.addEventListener('touchstart', function(event) {
                event.stopPropagation();
            });
            button.addEventListener('click', function(event) {
                core.ResourceHandler.retry();
            });
            this._errorPrinter.appendChild(button);
            this._loadingCount = -Infinity;
        }
    },

    /**
     * Erases the loading error text.
     *
     * @static
     * @method eraseLoadingError
     */
    eraseLoadingError() {
        if (this._errorPrinter && !this._errorShowed) {
            this._errorPrinter.innerHTML = '';
            this._errorPrinter.style.userSelect       = 'none';
            this._errorPrinter.style.webkitUserSelect = 'none';
            this._errorPrinter.style.msUserSelect     = 'none';
            this._errorPrinter.style.mozUserSelect    = 'none';
            this._errorPrinter.oncontextmenu = function() { return false; };
            this.startLoading();
        }
    },

    // The following code is partly borrowed from triacontane.
    /**
     * Displays the error text to the screen.
     *
     * @static
     * @method printError
     * @param {String} name The name of the error
     * @param {String} message The message of the error
     */
    printError(name, message) {
        this._errorShowed = true;
        this._hideProgress();
        this.hideFps();
        if (this._errorPrinter) {
            this._updateErrorPrinter();
            this._errorPrinter.innerHTML = this._makeErrorHtml(name, message);
            this._errorPrinter.style.userSelect       = 'text';
            this._errorPrinter.style.webkitUserSelect = 'text';
            this._errorPrinter.style.msUserSelect     = 'text';
            this._errorPrinter.style.mozUserSelect    = 'text';
            this._errorPrinter.oncontextmenu = null;    // enable context menu
            if (this._errorMessage) {
                this._makeErrorMessage();
            }
        }
        this._applyCanvasFilter();
        this._clearUpperCanvas();
    },

    /**
     * Shows the detail of error.
     *
     * @static
     * @method printErrorDetail
     */
    printErrorDetail(error) {
        if (this._errorPrinter && this._showErrorDetail) {
            var eventInfo = this._formatEventInfo(error);
            var eventCommandInfo = this._formatEventCommandInfo(error);
            var info = eventCommandInfo ? eventInfo + ", " + eventCommandInfo : eventInfo;
            var stack = this._formatStackTrace(error);
            this._makeErrorDetail(info, stack);
        }
    },

    /**
     * Sets the error message.
     *
     * @static
     * @method setErrorMessage
     */
    setErrorMessage(message) {
        this._errorMessage = message;
    },

    /**
     * Sets whether shows the detail of error.
     *
     * @static
     * @method setShowErrorDetail
     */
    setShowErrorDetail(showErrorDetail) {
        this._showErrorDetail = showErrorDetail;
    },

    /**
     * Shows the FPSMeter element.
     *
     * @static
     * @method showFps
     */
    showFps() {
        if (this._fpsMeter) {
            this._fpsMeter.show();
            this._modeBox.style.opacity = 1;
        }
    },

    /**
     * Hides the FPSMeter element.
     *
     * @static
     * @method hideFps
     */
    hideFps() {
        if (this._fpsMeter) {
            this._fpsMeter.hide();
            this._modeBox.style.opacity = 0;
        }
    },

    /**
     * Loads a font file.
     *
     * @static
     * @method loadFont
     * @param {String} name The face name of the font
     * @param {String} url The url of the font file
     */
    loadFont(name, url) {
        var style = document.createElement('style');
        var head = document.getElementsByTagName('head');
        var rule = '@font-face { font-family: "' + name + '"; src: url("' + url + '"); }';
        style.type = 'text/css';
        head.item(0).appendChild(style);
        style.sheet.insertRule(rule, 0);
        this._createFontLoader(name);
    },

    /**
     * Checks whether the font file is loaded.
     *
     * @static
     * @method isFontLoaded
     * @param {String} name The face name of the font
     * @return {Boolean} True if the font file is loaded
     */
    isFontLoaded(name) {
        if (Graphics._cssFontLoading) {
            if(Graphics._fontLoaded){
                return Graphics._fontLoaded.check('10px "'+name+'"');
            }

            return false;
        } else {
            if (!this._hiddenCanvas) {
                this._hiddenCanvas = document.createElement('canvas');
            }
            var context = this._hiddenCanvas.getContext('2d');
            var text = 'abcdefghijklmnopqrstuvwxyz';
            var width1, width2;
            context.font = '40px ' + name + ', sans-serif';
            width1 = context.measureText(text).width;
            context.font = '40px sans-serif';
            width2 = context.measureText(text).width;
            return width1 !== width2;
        }
    },

    /**
     * Starts playback of a video.
     *
     * @static
     * @method playVideo
     * @param {String} src
     */
    playVideo(src) {
        this._videoLoader = core.ResourceHandler.createLoader(null, this._playVideo.bind(this, src), this._onVideoError.bind(this));
        this._playVideo(src);
    },

    /**
     * @static
     * @method _playVideo
     * @param {String} src
     * @private
     */
    _playVideo(src) {
        this._video.src = src;
        this._video.onloadeddata = this._onVideoLoad.bind(this);
        this._video.onerror = this._videoLoader;
        this._video.onended = this._onVideoEnd.bind(this);
        this._video.load();
        this._videoLoading = true;
    },

    /**
     * Checks whether the video is playing.
     *
     * @static
     * @method isVideoPlaying
     * @return {Boolean} True if the video is playing
     */
    isVideoPlaying() {
        return this._videoLoading || this._isVideoVisible();
    },

    /**
     * Checks whether the browser can play the specified video type.
     *
     * @static
     * @method canPlayVideoType
     * @param {String} type The video type to test support for
     * @return {Boolean} True if the browser can play the specified video type
     */
    canPlayVideoType(type) {
        return this._video && this._video.canPlayType(type);
    },

    /**
     * Sets volume of a video.
     *
     * @static
     * @method setVideoVolume
     * @param {Number} value
     */
    setVideoVolume(value) {
        this._videoVolume = value;
        if (this._video) {
            this._video.volume = this._videoVolume;
        }
    },

    /**
     * Converts an x coordinate on the page to the corresponding
     * x coordinate on the canvas area.
     *
     * @static
     * @method pageToCanvasX
     * @param {Number} x The x coordinate on the page to be converted
     * @return {Number} The x coordinate on the canvas area
     */
    pageToCanvasX(x) {
        if (this._canvas) {
            var left = this._canvas.offsetLeft;
            return Math.round((x - left) / this._realScale);
        } else {
            return 0;
        }
    },

    /**
     * Converts a y coordinate on the page to the corresponding
     * y coordinate on the canvas area.
     *
     * @static
     * @method pageToCanvasY
     * @param {Number} y The y coordinate on the page to be converted
     * @return {Number} The y coordinate on the canvas area
     */
    pageToCanvasY(y) {
        if (this._canvas) {
            var top = this._canvas.offsetTop;
            return Math.round((y - top) / this._realScale);
        } else {
            return 0;
        }
    },

    /**
     * Checks whether the specified point is inside the game canvas area.
     *
     * @static
     * @method isInsideCanvas
     * @param {Number} x The x coordinate on the canvas area
     * @param {Number} y The y coordinate on the canvas area
     * @return {Boolean} True if the specified point is inside the game canvas area
     */
    isInsideCanvas(x, y) {
        return (x >= 0 && x < this._width && y >= 0 && y < this._height);
    },

    /**
     * Calls pixi.js garbage collector
     */
    callGC() {
        if (Graphics.isWebGL()) {
            Graphics._renderer.textureGC.run();
        }
    },

    /**
     * The width of the game screen.
     *
     * @static
     * @property width
     * @type Number
     */
    get width() {
        return this._width;
    },

    set width(value) {
        if (this._width !== value) {
            this._width = value;
            this._updateAllElements();
        }
    },

    /**
     * The height of the game screen.
     *
     * @static
     * @property height
     * @type Number
     */
    get height() {
        return this._height;
    },

    set height(value) {
        if (this._height !== value) {
            this._height = value;
            this._updateAllElements();
        }
    },

    /**
     * The width of the window display area.
     *
     * @static
     * @property boxWidth
     * @type Number
     */
    get boxWidth() {
        return this._boxWidth;
    },

    set boxWidth(value) {
        this._boxWidth = value;
    },

    /**
     * The height of the window display area.
     *
     * @static
     * @property boxHeight
     * @type Number
     */
    get boxHeight() {
        return this._boxHeight;
    },

    set boxHeight(value) {
        this._boxHeight = value;
    },

    /**
     * The zoom scale of the game screen.
     *
     * @static
     * @property scale
     * @type Number
     */
    get scale() {
        return this._scale;
    },

    set scale(value) {
        if (this._scale !== value) {
            this._scale = value;
            this._updateAllElements();
        }
    },

    /**
     * @static
     * @method _createAllElements
     * @private
     */
    _createAllElements() {
        this._createErrorPrinter();
        this._createCanvas();
        this._createVideo();
        this._createUpperCanvas();
        this._createRenderer();
        this._createFPSMeter();
        this._createModeBox();
        this._createGameFontLoader();
    },

    /**
     * @static
     * @method _updateAllElements
     * @private
     */
    _updateAllElements() {
        this._updateRealScale();
        this._updateErrorPrinter();
        this._updateCanvas();
        this._updateVideo();
        this._updateUpperCanvas();
        this._updateRenderer();
        this._paintUpperCanvas();
        this._updateProgress();
    },

    /**
     * @static
     * @method _updateRealScale
     * @private
     */
    _updateRealScale() {
        if (this._stretchEnabled) {
            var h = window.innerWidth / this._width;
            var v = window.innerHeight / this._height;
            if (h >= 1 && h - 0.01 <= 1) h = 1;
            if (v >= 1 && v - 0.01 <= 1) v = 1;
            this._realScale = Math.min(h, v);
        } else {
            this._realScale = this._scale;
        }
    },

    /**
     * @static
     * @method _makeErrorHtml
     * @param {String} name
     * @param {String} message
     * @return {String}
     * @private
     */
    _makeErrorHtml(name, message) {
        return ('<font color="yellow"><b>' + name + '</b></font><br>' +
                '<font color="white">' + decodeURIComponent(message) + '</font><br>');
    },

    /**
     * @static
     * @method _defaultStretchMode
     * @private
     */
    _defaultStretchMode() {
        return core.Utils.isNwjs() || core.Utils.isMobileDevice();
    },

    /**
     * @static
     * @method _testCanvasBlendModes
     * @private
     */
    _testCanvasBlendModes() {
        var canvas, context, imageData1, imageData2;
        canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        context = canvas.getContext('2d');
        context.globalCompositeOperation = 'source-over';
        context.fillStyle = 'white';
        context.fillRect(0, 0, 1, 1);
        context.globalCompositeOperation = 'difference';
        context.fillStyle = 'white';
        context.fillRect(0, 0, 1, 1);
        imageData1 = context.getImageData(0, 0, 1, 1);
        context.globalCompositeOperation = 'source-over';
        context.fillStyle = 'black';
        context.fillRect(0, 0, 1, 1);
        context.globalCompositeOperation = 'saturation';
        context.fillStyle = 'white';
        context.fillRect(0, 0, 1, 1);
        imageData2 = context.getImageData(0, 0, 1, 1);
        this._canUseDifferenceBlend = imageData1.data[0] === 0;
        this._canUseSaturationBlend = imageData2.data[0] === 0;
    },

    /**
     * @static
     * @method _modifyExistingElements
     * @private
     */
    _modifyExistingElements() {
        var elements = document.getElementsByTagName('*');
        for (var i = 0; i < elements.length; i++) {
            if (elements[i].style.zIndex > 0) {
                elements[i].style.zIndex = 0;
            }
        }
    },

    /**
     * @static
     * @method _createErrorPrinter
     * @private
     */
    _createErrorPrinter() {
        this._errorPrinter = document.createElement('p');
        this._errorPrinter.id = 'ErrorPrinter';
        this._updateErrorPrinter();
        document.body.appendChild(this._errorPrinter);
    },

    /**
     * @static
     * @method _updateErrorPrinter
     * @private
     */
    _updateErrorPrinter() {
        this._errorPrinter.width = this._width * 0.9;
        if (this._errorShowed && this._showErrorDetail) {
            this._errorPrinter.height = this._height * 0.9;
        } else if (this._errorShowed && this._errorMessage) {
            this._errorPrinter.height = 100;
        } else {
            this._errorPrinter.height = 40;
        }
        this._errorPrinter.style.textAlign = 'center';
        this._errorPrinter.style.textShadow = '1px 1px 3px #000';
        this._errorPrinter.style.fontSize = '20px';
        this._errorPrinter.style.zIndex = 99;
        this._centerElement(this._errorPrinter);
    },

    /**
     * @static
     * @method _makeErrorMessage
     * @private
     */
    _makeErrorMessage() {
        var mainMessage       = document.createElement('div');
        var style             = mainMessage.style;
        style.color           = 'white';
        style.textAlign       = 'left';
        style.fontSize        = '18px';
        mainMessage.innerHTML = '<hr>' + this._errorMessage;
        this._errorPrinter.appendChild(mainMessage);
    },

    /**
     * @static
     * @method _makeErrorDetail
     * @private
     */
    _makeErrorDetail(info, stack) {
        var detail             = document.createElement('div');
        var style              = detail.style;
        style.color            = 'white';
        style.textAlign        = 'left';
        style.fontSize         = '18px';
        detail.innerHTML       = '<br><hr>' + info + '<br><br>' + stack;
        this._errorPrinter.appendChild(detail);
    },

    /**
     * @static
     * @method _formatEventInfo
     * @private
     */
    _formatEventInfo(error) {
        switch (String(error.eventType)) {
        case "map_event":
            return "MapID: %1, MapEventID: %2, page: %3, line: %4".format(error.mapId, error.mapEventId, error.page, error.line);
        case "common_event":
            return "CommonEventID: %1, line: %2".format(error.commonEventId, error.line);
        case "battle_event":
            return "TroopID: %1, page: %2, line: %3".format(error.troopId, error.page, error.line);
        case "test_event":
            return "TestEvent, line: %1".format(error.line);
        default:
            return "No information";
        }
    },

    /**
     * @static
     * @method _formatEventCommandInfo
     * @private
     */
    _formatEventCommandInfo(error) {
        switch (String(error.eventCommand)) {
        case "plugin_command":
            return "◆Plugin Command: " + error.content;
        case "script":
            return "◆Script: " + error.content;
        case "control_variables":
            return "◆Control Variables: Script: " + error.content;
        case "conditional_branch_script":
            return "◆If: Script: " + error.content;
        case "set_route_script":
            return "◆Set Movement Route: ◇Script: " + error.content;
        case "auto_route_script":
            return "Autonomous Movement Custom Route: ◇Script: " + error.content;
        case "other":
        default:
            return "";
        }
    },

    /**
     * @static
     * @method _formatStackTrace
     * @private
     */
    _formatStackTrace(error) {
        return decodeURIComponent((error.stack || '')
            .replace(/file:.*js\//g, '')
            .replace(/http:.*js\//g, '')
            .replace(/https:.*js\//g, '')
            .replace(/chrome-extension:.*js\//g, '')
            .replace(/\n/g, '<br>'));
    },

    /**
     * @static
     * @method _createCanvas
     * @private
     */
    _createCanvas() {
        this._canvas = document.createElement('canvas');
        this._canvas.id = 'GameCanvas';
        this._updateCanvas();
        document.body.appendChild(this._canvas);
    },

    /**
     * @static
     * @method _updateCanvas
     * @private
     */
    _updateCanvas() {
        this._canvas.width = this._width;
        this._canvas.height = this._height;
        this._canvas.style.zIndex = 1;
        this._centerElement(this._canvas);
    },

    /**
     * @static
     * @method _createVideo
     * @private
     */
    _createVideo() {
        this._video = document.createElement('video');
        this._video.id = 'GameVideo';
        this._video.style.opacity = 0;
        this._video.setAttribute('playsinline', '');
        this._video.volume = this._videoVolume;
        this._updateVideo();
        this._video.playsInline = true;
        document.body.appendChild(this._video);
    },

    /**
     * @static
     * @method _updateVideo
     * @private
     */
    _updateVideo() {
        this._video.width = this._width;
        this._video.height = this._height;
        this._video.style.zIndex = 2;
        this._centerElement(this._video);
    },

    /**
     * @static
     * @method _createUpperCanvas
     * @private
     */
    _createUpperCanvas() {
        this._upperCanvas = document.createElement('canvas');
        this._upperCanvas.id = 'UpperCanvas';
        this._updateUpperCanvas();
        document.body.appendChild(this._upperCanvas);
    },

    /**
     * @static
     * @method _updateUpperCanvas
     * @private
     */
    _updateUpperCanvas() {
        this._upperCanvas.width = this._width;
        this._upperCanvas.height = this._height;
        this._upperCanvas.style.zIndex = 3;
        this._centerElement(this._upperCanvas);
    },

    /**
     * @static
     * @method _clearUpperCanvas
     * @private
     */
    _clearUpperCanvas() {
        var context = this._upperCanvas.getContext('2d');
        context.clearRect(0, 0, this._width, this._height);
    },

    /**
     * @static
     * @method _paintUpperCanvas
     * @private
     */
    _paintUpperCanvas() {
        this._clearUpperCanvas();
        if (this._loadingImage && this._loadingCount >= 20) {
            var context = this._upperCanvas.getContext('2d');
            var dx = (this._width - this._loadingImage.width) / 2;
            var dy = (this._height - this._loadingImage.height) / 2;
            var alpha = ((this._loadingCount - 20) / 30).clamp(0, 1);
            context.save();
            context.globalAlpha = alpha;
            context.drawImage(this._loadingImage, dx, dy);
            context.restore();
        }
    },

    /**
     * @static
     * @method _createRenderer
     * @private
     */
    _createRenderer() {
        this.ready = core.WebGPURenderer.create(this._canvas, this._width, this._height)
            .then(renderer => { this._renderer = renderer; });
    },

    /**
     * @static
     * @method _updateRenderer
     * @private
     */
    _updateRenderer() {
        if (this._renderer) {
            this._renderer.resize(this._width, this._height);
        }
    },

    /**
     * @static
     * @method _createFPSMeter
     * @private
     */
    _createFPSMeter() {
        var options = { graph: 1, decimals: 0, theme: 'transparent', toggleOn: null };
        this._fpsMeter = new core.FrameMeter();
        this._fpsMeter.hide();
    },

    /**
     * @static
     * @method _createModeBox
     * @private
     */
    _createModeBox() {
        var box = document.createElement('div');
        box.id = 'modeTextBack';
        box.style.position = 'absolute';
        box.style.left = '5px';
        box.style.top = '5px';
        box.style.width = '119px';
        box.style.height = '58px';
        box.style.background = 'rgba(0,0,0,0.2)';
        box.style.zIndex = 9;
        box.style.opacity = 0;

        var text = document.createElement('div');
        text.id = 'modeText';
        text.style.position = 'absolute';
        text.style.left = '0px';
        text.style.top = '41px';
        text.style.width = '119px';
        text.style.fontSize = '12px';
        text.style.fontFamily = 'monospace';
        text.style.color = 'white';
        text.style.textAlign = 'center';
        text.style.textShadow = '1px 1px 0 rgba(0,0,0,0.5)';
        text.textContent = 'WebGPU mode';

        document.body.appendChild(box);
        box.appendChild(text);

        this._modeBox = box;
    },

    /**
     * @static
     * @method _createGameFontLoader
     * @private
     */
    _createGameFontLoader() {
        this._createFontLoader('GameFont');
    },

    /**
     * @static
     * @method _createFontLoader
     * @param {String} name
     * @private
     */
    _createFontLoader(name) {
        var div = document.createElement('div');
        var text = document.createTextNode('.');
        div.style.fontFamily = name;
        div.style.fontSize = '0px';
        div.style.color = 'transparent';
        div.style.position = 'absolute';
        div.style.margin = 'auto';
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.width = '1px';
        div.style.height = '1px';
        div.appendChild(text);
        document.body.appendChild(div);
    },

    /**
     * @static
     * @method _centerElement
     * @param {HTMLElement} element
     * @private
     */
    _centerElement(element) {
        var width = element.width * this._realScale;
        var height = element.height * this._realScale;
        element.style.position = 'absolute';
        element.style.margin = 'auto';
        element.style.top = 0;
        element.style.left = 0;
        element.style.right = 0;
        element.style.bottom = 0;
        element.style.width = width + 'px';
        element.style.height = height + 'px';
    },

    /**
     * @static
     * @method _disableTextSelection
     * @private
     */
    _disableTextSelection() {
        var body = document.body;
        body.style.userSelect = 'none';
        body.style.webkitUserSelect = 'none';
        body.style.msUserSelect = 'none';
        body.style.mozUserSelect = 'none';
    },

    /**
     * @static
     * @method _disableContextMenu
     * @private
     */
    _disableContextMenu() {
        var elements = document.body.getElementsByTagName('*');
        var oncontextmenu = function() { return false; };
        for (var i = 0; i < elements.length; i++) {
            elements[i].oncontextmenu = oncontextmenu;
        }
    },

    /**
     * @static
     * @method _applyCanvasFilter
     * @private
     */
    _applyCanvasFilter() {
        if (this._canvas) {
            this._canvas.style.opacity = 0.5;
            this._canvas.style.filter = 'blur(8px)';
            this._canvas.style.webkitFilter = 'blur(8px)';
        }
    },

    /**
     * @static
     * @method _onVideoLoad
     * @private
     */
    _onVideoLoad() {
        this._video.play();
        this._updateVisibility(true);
        this._videoLoading = false;
    },

    /**
     * @static
     * @method _onVideoError
     * @private
     */
    _onVideoError() {
        this._updateVisibility(false);
        this._videoLoading = false;
    },

    /**
     * @static
     * @method _onVideoEnd
     * @private
     */
    _onVideoEnd() {
        this._updateVisibility(false);
    },

    /**
     * @static
     * @method _updateVisibility
     * @param {Boolean} videoVisible
     * @private
     */
    _updateVisibility(videoVisible) {
        this._video.style.opacity = videoVisible ? 1 : 0;
        this._canvas.style.opacity = videoVisible ? 0 : 1;
    },

    /**
     * @static
     * @method _isVideoVisible
     * @return {Boolean}
     * @private
     */
    _isVideoVisible() {
        return this._video.style.opacity > 0;
    },

    /**
     * @static
     * @method _setupEventHandlers
     * @private
     */
    _setupEventHandlers() {
        window.addEventListener('resize', this._onWindowResize.bind(this));
        document.addEventListener('keydown', this._onKeyDown.bind(this));
        document.addEventListener('keydown', this._onTouchEnd.bind(this));
        document.addEventListener('mousedown', this._onTouchEnd.bind(this));
        document.addEventListener('touchend', this._onTouchEnd.bind(this));
    },

    /**
     * @static
     * @method _onWindowResize
     * @private
     */
    _onWindowResize() {
        this._updateAllElements();
    },

    /**
     * @static
     * @method _onKeyDown
     * @param {KeyboardEvent} event
     * @private
     */
    _onKeyDown(event) {
        if (!event.ctrlKey && !event.altKey) {
            switch (event.keyCode) {
            case 113:   // F2
                event.preventDefault();
                this._switchFPSMeter();
                break;
            case 114:   // F3
                event.preventDefault();
                this._switchStretchMode();
                break;
            case 115:   // F4
                event.preventDefault();
                this._switchFullScreen();
                break;
            }
        }
    },

    /**
     * @static
     * @method _onTouchEnd
     * @param {TouchEvent} event
     * @private
     */
    _onTouchEnd(event) {
        if (!this._videoUnlocked) {
            this._video.play();
            this._videoUnlocked = true;
        }
        if (this._isVideoVisible() && this._video.paused) {
            this._video.play();
        }
    },

    /**
     * @static
     * @method _switchFPSMeter
     * @private
     */
    _switchFPSMeter() {
        if (this._fpsMeter.isPaused) {
            this.showFps();
            this._fpsMeter.showFps();
            this._fpsMeterToggled = false;
        } else if (!this._fpsMeterToggled) {
            this._fpsMeter.showDuration();
            this._fpsMeterToggled = true;
        } else {
            this.hideFps();
        }
    },

    /**
     * @static
     * @method _switchStretchMode
     * @return {Boolean}
     * @private
     */
    _switchStretchMode() {
        this._stretchEnabled = !this._stretchEnabled;
        this._updateAllElements();
    },

    /**
     * @static
     * @method _switchFullScreen
     * @private
     */
    _switchFullScreen() {
        if (this._isFullScreen()) {
            this._cancelFullScreen();
        } else {
            this._requestFullScreen();
        }
    },

    /**
     * @static
     * @method _isFullScreen
     * @return {Boolean}
     * @private
     */
    _isFullScreen() {
        return document.fullscreenElement ||
               document.mozFullScreen ||
               document.webkitFullscreenElement ||
               document.msFullscreenElement;
    },

    /**
     * @static
     * @method _requestFullScreen
     * @private
     */
    _requestFullScreen() {
        var element = document.body;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullScreen) {
            element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    },

    /**
     * @static
     * @method _cancelFullScreen
     * @private
     */
    _cancelFullScreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    },
};

export {Graphics};
