import * as core from './index.js';

//-----------------------------------------------------------------------------
/**
 * The static class that handles HTML5 Audio.
 *
 * @class Html5Audio
 * @constructor
 */
const Html5Audio = {
    _initialized: false,

    _unlocked: false,

    _audioElement: null,

    _gainTweenInterval: null,

    _tweenGain: 0,

    _tweenTargetGain: 0,

    _tweenGainStep: 0,

    _staticSePath: null,

    /**
     * Sets up the Html5 Audio.
     *
     * @static
     * @method setup
     * @param {String} url The url of the audio file
     */
    setup(url) {
        if (!this._initialized) {
            this.initialize();
        }
        this.clear();

        if(core.Decrypter.hasEncryptedAudio && this._audioElement.src) {
            window.URL.revokeObjectURL(this._audioElement.src);
        }
        this._url = url;
    },

    /**
     * Initializes the audio system.
     *
     * @static
     * @method initialize
     * @return {Boolean} True if the audio system is available
     */
    initialize() {
        if (!this._initialized) {
            if (!this._audioElement) {
                try {
                    this._audioElement = new Audio();
                } catch (e) {
                    this._audioElement = null;
                }
            }
            if (!!this._audioElement) this._setupEventHandlers();
            this._initialized = true;
        }
        return !!this._audioElement;
    },

    /**
     * @static
     * @method _setupEventHandlers
     * @private
     */
    _setupEventHandlers() {
        document.addEventListener('touchstart', this._onTouchStart.bind(this));
        document.addEventListener('visibilitychange', this._onVisibilityChange.bind(this));
        this._audioElement.addEventListener("loadeddata", this._onLoadedData.bind(this));
        this._audioElement.addEventListener("error", this._onError.bind(this));
        this._audioElement.addEventListener("ended", this._onEnded.bind(this));
    },

    /**
     * @static
     * @method _onTouchStart
     * @private
     */
    _onTouchStart() {
        if (this._audioElement && !this._unlocked) {
            if (this._isLoading) {
                this._load(this._url);
                this._unlocked = true;
            } else {
                if (this._staticSePath) {
                    this._audioElement.src = this._staticSePath;
                    this._audioElement.volume = 0;
                    this._audioElement.loop = false;
                    this._audioElement.play();
                    this._unlocked = true;
                }
            }
        }
    },

    /**
     * @static
     * @method _onVisibilityChange
     * @private
     */
    _onVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            this._onHide();
        } else {
            this._onShow();
        }
    },

    /**
     * @static
     * @method _onLoadedData
     * @private
     */
    _onLoadedData() {
        this._buffered = true;
        if (this._unlocked) this._onLoad();
    },

    /**
     * @static
     * @method _onError
     * @private
     */
    _onError() {
        this._hasError = true;
    },

    /**
     * @static
     * @method _onEnded
     * @private
     */
    _onEnded() {
        if (!this._audioElement.loop) {
            this.stop();
        }
    },

    /**
     * @static
     * @method _onHide
     * @private
     */
    _onHide() {
        this._audioElement.volume = 0;
        this._tweenGain = 0;
    },

    /**
     * @static
     * @method _onShow
     * @private
     */
    _onShow() {
        this.fadeIn(0.5);
    },

    /**
     * Clears the audio data.
     *
     * @static
     * @method clear
     */
    clear() {
        this.stop();
        this._volume = 1;
        this._loadListeners = [];
        this._hasError = false;
        this._autoPlay = false;
        this._isLoading = false;
        this._buffered = false;
    },

    /**
     * Set the URL of static se.
     *
     * @static
     * @param {String} url
     */
    setStaticSe(url) {
        if (!this._initialized) {
            this.initialize();
            this.clear();
        }
        this._staticSePath = url;
    },

    /**
     * [read-only] The url of the audio file.
     *
     * @property url
     * @type String
     */
    get url() {
        return Html5Audio._url;
    },

    /**
     * The volume of the audio.
     *
     * @property volume
     * @type Number
     */
    get volume() {
        return Html5Audio._volume;
    },

    set volume(value) {
        Html5Audio._volume = value;
        if (Html5Audio._audioElement) {
            Html5Audio._audioElement.volume = this._volume;
        }
    },

    /**
     * Checks whether the audio data is ready to play.
     *
     * @static
     * @method isReady
     * @return {Boolean} True if the audio data is ready to play
     */
    isReady() {
        return this._buffered;
    },

    /**
     * Checks whether a loading error has occurred.
     *
     * @static
     * @method isError
     * @return {Boolean} True if a loading error has occurred
     */
    isError() {
        return this._hasError;
    },

    /**
     * Checks whether the audio is playing.
     *
     * @static
     * @method isPlaying
     * @return {Boolean} True if the audio is playing
     */
    isPlaying() {
        return !this._audioElement.paused;
    },

    /**
     * Plays the audio.
     *
     * @static
     * @method play
     * @param {Boolean} loop Whether the audio data play in a loop
     * @param {Number} offset The start position to play in seconds
     */
    play(loop, offset) {
        if (this.isReady()) {
            offset = offset || 0;
            this._startPlaying(loop, offset);
        } else if (Html5Audio._audioElement) {
            this._autoPlay = true;
            this.addLoadListener(function () {
                if (this._autoPlay) {
                    this.play(loop, offset);
                    if (this._gainTweenInterval) {
                        clearInterval(this._gainTweenInterval);
                        this._gainTweenInterval = null;
                    }
                }
            }.bind(this));
            if (!this._isLoading) this._load(this._url);
        }
    },

    /**
     * Stops the audio.
     *
     * @static
     * @method stop
     */
    stop() {
        if (this._audioElement) this._audioElement.pause();
        this._autoPlay = false;
        if (this._tweenInterval) {
            clearInterval(this._tweenInterval);
            this._tweenInterval = null;
            this._audioElement.volume = 0;
        }
    },

    /**
     * Performs the audio fade-in.
     *
     * @static
     * @method fadeIn
     * @param {Number} duration Fade-in time in seconds
     */
    fadeIn(duration) {
        if (this.isReady()) {
            if (this._audioElement) {
                this._tweenTargetGain = this._volume;
                this._tweenGain = 0;
                this._startGainTween(duration);
            }
        } else if (this._autoPlay) {
            this.addLoadListener(function () {
                this.fadeIn(duration);
            }.bind(this));
        }
    },

    /**
     * Performs the audio fade-out.
     *
     * @static
     * @method fadeOut
     * @param {Number} duration Fade-out time in seconds
     */
    fadeOut(duration) {
        if (this._audioElement) {
            this._tweenTargetGain = 0;
            this._tweenGain = this._volume;
            this._startGainTween(duration);
        }
    },

    /**
     * Gets the seek position of the audio.
     *
     * @static
     * @method seek
     */
    seek() {
        if (this._audioElement) {
            return this._audioElement.currentTime;
        } else {
            return 0;
        }
    },

    /**
     * Add a callback function that will be called when the audio data is loaded.
     *
     * @static
     * @method addLoadListener
     * @param {Function} listner The callback function
     */
    addLoadListener(listner) {
        this._loadListeners.push(listner);
    },

    /**
     * @static
     * @method _load
     * @param {String} url
     * @private
     */
    _load(url) {
        if (this._audioElement) {
            this._isLoading = true;
            this._audioElement.src = url;
            this._audioElement.load();
        }
    },

    /**
     * @static
     * @method _startPlaying
     * @param {Boolean} loop
     * @param {Number} offset
     * @private
     */
    _startPlaying(loop, offset) {
        this._audioElement.loop = loop;
        if (this._gainTweenInterval) {
            clearInterval(this._gainTweenInterval);
            this._gainTweenInterval = null;
        }
        if (this._audioElement) {
            this._audioElement.volume = this._volume;
            this._audioElement.currentTime = offset;
            this._audioElement.play();
        }
    },

    /**
     * @static
     * @method _onLoad
     * @private
     */
    _onLoad() {
        this._isLoading = false;
        while (this._loadListeners.length > 0) {
            var listener = this._loadListeners.shift();
            listener();
        }
    },

    /**
     * @static
     * @method _startGainTween
     * @params {Number} duration
     * @private
     */
    _startGainTween(duration) {
        this._audioElement.volume = this._tweenGain;
        if (this._gainTweenInterval) {
            clearInterval(this._gainTweenInterval);
            this._gainTweenInterval = null;
        }
        this._tweenGainStep = (this._tweenTargetGain - this._tweenGain) / (60 * duration);
        this._gainTweenInterval = setInterval(function () {
            Html5Audio._applyTweenValue(Html5Audio._tweenTargetGain);
        }, 1000 / 60);
    },

    /**
     * @static
     * @method _applyTweenValue
     * @param {Number} volume
     * @private
     */
    _applyTweenValue(volume) {
        Html5Audio._tweenGain += Html5Audio._tweenGainStep;
        if (Html5Audio._tweenGain < 0 && Html5Audio._tweenGainStep < 0) {
            Html5Audio._tweenGain = 0;
        }
        else if (Html5Audio._tweenGain > volume && Html5Audio._tweenGainStep > 0) {
            Html5Audio._tweenGain = volume;
        }

        if (Math.abs(Html5Audio._tweenTargetGain - Html5Audio._tweenGain) < 0.01) {
            Html5Audio._tweenGain = Html5Audio._tweenTargetGain;
            clearInterval(Html5Audio._gainTweenInterval);
            Html5Audio._gainTweenInterval = null;
        }

        Html5Audio._audioElement.volume = Html5Audio._tweenGain;
    },
};

export {Html5Audio};
