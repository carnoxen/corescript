import * as managers from '../managers/index.js';

const ProgressWatcher = {
    initialize() {
        this.clearProgress();
        managers.ImageManager.setCreationHook(this._bitmapListener.bind(this));
        managers.AudioManager.setCreationHook(this._audioListener.bind(this));
    },

    _bitmapListener(bitmap) {
        this._countLoading++;
        bitmap.addLoadListener(function(){
            this._countLoaded++;
            this._progressListener(this._countLoaded, this._countLoading);
        }.bind(this));
    },

    _audioListener(audio) {
        this._countLoading++;
        audio.addLoadListener(function(){
            this._countLoaded++;
            this._progressListener(this._countLoaded, this._countLoading);
        }.bind(this));
    },

    setProgressListener(progressListener) {
        this._progressListener = progressListener;
    },

    clearProgress() {
        this._countLoading = 0;
        this._countLoaded = 0;
    },

    truncateProgress() {
        if(this._countLoaded){
            this._countLoading -= this._countLoaded;
            this._countLoaded = 0;
        }
    },
};

export {ProgressWatcher};
