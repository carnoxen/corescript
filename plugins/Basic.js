/*:
 * @plugindesc Basic plugin for manipulating important parameters.
 * @author RM CoreScript team
 *
 * @help
 * Basic plugin for manipulating important parameters.
 * There is no plugin command.
 *
 * Caching images improves performance but increases memory allocation.
 * On mobile devices, a lot of memory allocation causes the browser to crash.
 * Therefore, the upper limit of memory allocation is set with cacheLimit.
 *
 * If you want to regain high performance, just increase cacheLimit.
 * There is no need to revert to 1.4.
 *
 * @param cacheLimit
 * @type number
 * @desc The upper limit of images' cached size (MPixel)
 * @default 10
 *
 * @param screenWidth
 * @type number
 * @desc The resolution of screen width
 * @default 816
 *
 * @param screenHeight
 * @type number
 * @desc The resolution of screen height
 * @default 624
 *
 * @param changeWindowWidthTo
 * @type number
 * @desc If set, change window width to this value
 *
 * @param changeWindowHeightTo
 * @type number
 * @desc If set, change window height to this value
 *
 * @param renderingMode
 * @type select
 * @option canvas
 * @option webgl
 * @option auto
 * @desc The rendering mode (canvas/webgl/auto)
 * @default auto
 *
 * @param alwaysDash
 * @type boolean
 * @desc The initial value whether the player always dashes (on/off)
 * @on ON
 * @off OFF
 * @default false
 *
 * @param textSpeed
 * @type number
 * @desc The text speed on "Show Text". The larger this parameter is, the slower text speed. (0: show all texts at once)
 * @default 1
 *
 * @param autoSaveFileId
 * @type number
 * @desc The file number to auto save when "Transfer Player" (0: off)
 * @default 0
 *
 * @param errorMessage
 * @type string
 * @desc The message when error occurred
 * @default Error occurred. Please ask to the creator of this game.
 *
 * @param showErrorDetail
 * @type boolean
 * @desc Show where the error is caused and stack trace when error
 * @default true
 *
 * @param enableProgressBar
 * @type boolean
 * @desc Show progress bar when it takes a long time to load resources
 * @default true
 *
 * @param maxRenderingFps
 * @type number
 * @desc The maximum value of rendering frame per seconds (0: unlimited)
 * @default 0
 */

/*:ja
 * @plugindesc 基本的なパラメーターを設定するプラグインです。
 * @author RM CoreScript team
 *
 * @help
 * 基本的なパラメーターを設定するプラグインです。
 * このプラグインにはプラグインコマンドはありません。
 *
 * 画像をキャッシュするとパフォーマンスは向上しますが、その分メモリ確保も増大します。
 * モバイルデバイスでは、たくさんのメモリ確保はブラウザをクラッシュさせます。
 * そこで、メモリ確保の上限を「画像キャッシュ上限値」で設定しています。
 *
 * もし高いパフォーマンスを取り戻したければ、ただ画像キャッシュ上限値を増加させればよいです。
 * 1.4に戻す必要はありません。
 *
 * @param cacheLimit
 * @type number
 * @text 画像キャッシュ上限値
 * @desc 画像のメモリへのキャッシュの上限値 (MPix)
 * @default 10
 *
 * @param screenWidth
 * @type number
 * @text ゲーム画面の幅
 * @default 816
 *
 * @param screenHeight
 * @type number
 * @text ゲーム画面の高さ
 * @default 624
 *
 * @param changeWindowWidthTo
 * @type number
 * @text ウィンドウの幅
 * @desc 値が設定されなかった場合、ゲーム画面の幅と同じ
 *
 * @param changeWindowHeightTo
 * @type number
 * @text ウィンドウの高さ
 * @desc 値が設定されなかった場合、ゲーム画面の高さと同じ
 *
 * @param renderingMode
 * @type select
 * @option canvas
 * @option webgl
 * @option auto
 * @text レンダリングモード
 * @default auto
 *
 * @param alwaysDash
 * @type boolean
 * @text 「常時ダッシュ」の初期値
 * @on ON
 * @off OFF
 * @default false
 *
 * @param textSpeed
 * @type number
 * @text 「文章の表示」のスピード
 * @desc 数字が大きいほど文章の表示スピードが遅くなります (0を指定した場合は一度に全文を表示します)
 * @default 1
 *
 * @param autoSaveFileId
 * @type number
 * @text オートセーブ番号
 * @desc 「場所移動」の際に指定したファイル番号にオートセーブします（0を指定した場合はオートセーブしません）
 * @default 0
 *
 * @param errorMessage
 * @type string
 * @text エラーメッセージ
 * @desc エラー時にプレイヤーに向けて表示するメッセージです
 * @default エラーが発生しました。ゲームの作者にご連絡ください。
 *
 * @param showErrorDetail
 * @type boolean
 * @text エラー詳細表示
 * @desc ONにすると、エラー時にエラーを発生させたイベントの情報とスタックトレースを表示します
 * @default true
 *
 * @param enableProgressBar
 * @type boolean
 * @text ロード進捗バー有効化
 * @desc ONにすると、読み込みに時間がかかっている時にロード進捗バーを表示します
 * @default true
 *
 * @param maxRenderingFps
 * @type number
 * @text 描画FPS上限値
 * @desc 描画FPSの上限値を設定します (0を指定した場合は制限なし)
 * @default 0
 */

export default function install({core, managers, windows}) {
    (function() {
        'use strict';
        function isNumber(str) {
            return !!str && !isNaN(str);
        }

        function toNumber(str, def) {
            return isNumber(str) ? +str : def;
        }

        var parameters = managers.PluginManager.parameters('Basic');
        var cacheLimit = toNumber(parameters['cacheLimit'], 10);
        var screenWidth = toNumber(parameters['screenWidth'], 816);
        var screenHeight = toNumber(parameters['screenHeight'], 624);
        var renderingMode = parameters['renderingMode'].toLowerCase();
        var alwaysDash = (parameters['alwaysDash'] === 'true') ||(parameters['alwaysDash'] === 'on');
        var textSpeed = toNumber(parameters['textSpeed'], 1);
        var windowWidthTo = toNumber(parameters['changeWindowWidthTo'], 0);
        var windowHeightTo = toNumber(parameters['changeWindowHeightTo'], 0);
        var maxRenderingFps = toNumber(parameters['maxRenderingFps'], 0);
        var autoSaveFileId = toNumber(parameters['autoSaveFileId'], 0);
        var errorMessage = parameters['errorMessage'];
        var showErrorDetail = parameters['showErrorDetail'] === 'true';
        var enableProgressBar = parameters['enableProgressBar'] === 'true';

        var windowWidth;
        var windowHeight;

        if(windowWidthTo){
            windowWidth = windowWidthTo;
        }else if(screenWidth !== managers.SceneManager._screenWidth){
            windowWidth = screenWidth;
        }

        if(windowHeightTo){
            windowHeight = windowHeightTo;
        }else if(screenHeight !== managers.SceneManager._screenHeight){
            windowHeight = screenHeight;
        }


        core.ImageCache.limit = cacheLimit * 1000 * 1000;
        managers.SceneManager._screenWidth = screenWidth;
        managers.SceneManager._screenHeight = screenHeight;
        managers.SceneManager._boxWidth = screenWidth;
        managers.SceneManager._boxHeight = screenHeight;

        managers.SceneManager.preferableRendererType = function() {
            if (core.Utils.isOptionValid('canvas')) {
                return 'canvas';
            } else if (core.Utils.isOptionValid('webgl')) {
                return 'webgl';
            } else if (renderingMode === 'canvas') {
                return 'canvas';
            } else if (renderingMode === 'webgl') {
                return 'webgl';
            } else {
                return 'auto';
            }
        };

        var _ConfigManager_applyData = managers.ConfigManager.applyData;
        managers.ConfigManager.applyData = function(config) {
            _ConfigManager_applyData.apply(this, arguments);
            if (config['alwaysDash'] === undefined) {
                this.alwaysDash = alwaysDash;
            }
        };

        var previousClearFlags = windows.Message.prototype.clearFlags;
        windows.Message.prototype.clearFlags = function(textState) {
            previousClearFlags.apply(this, arguments);
            this._textSpeed = textSpeed - 1;
        };

        var _SceneManager_initNwjs = managers.SceneManager.initNwjs;
        managers.SceneManager.initNwjs = function() {
            _SceneManager_initNwjs.apply(this, arguments);

            if (core.Utils.isNwjs() && windowWidth && windowHeight) {
                var dw = windowWidth - window.innerWidth;
                var dh = windowHeight - window.innerHeight;
                window.moveBy(-dw / 2, -dh / 2);
                window.resizeBy(dw, dh);
            }
        };

        if (maxRenderingFps) {
            var currentTime = Date.now();
            var deltaTime = 1000 / maxRenderingFps;
            var accumulator = 0;
            var _SceneManager_renderScene = managers.SceneManager.renderScene;
            managers.SceneManager.renderScene = function() {
                var newTime = Date.now();
                accumulator += newTime - currentTime;
                currentTime = newTime;
                if (accumulator >= deltaTime) {
                    accumulator -= deltaTime;
                    _SceneManager_renderScene.apply(this, arguments);
                }
            };
        }

        managers.DataManager.setAutoSaveFileId(autoSaveFileId);
        core.Graphics.setErrorMessage(errorMessage);
        core.Graphics.setShowErrorDetail(showErrorDetail);
        core.Graphics.setProgressEnabled(enableProgressBar);
    })();
}
