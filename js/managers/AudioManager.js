import * as core from '../core/index.js';

//-----------------------------------------------------------------------------
// AudioManager
//
// The static class that handles BGM, BGS, ME and SE.
const AudioManager = {
    _masterVolume: 1,

    // (min: 0, max: 1)
    _bgmVolume: 100,

    _bgsVolume: 100,

    _meVolume: 100,

    _seVolume: 100,

    _currentBgm: null,

    _currentBgs: null,

    _bgmBuffer: null,

    _bgsBuffer: null,

    _meBuffer: null,

    _seBuffers: [],

    _staticBuffers: [],

    _replayFadeTime: 0.5,

    _path: 'audio/',

    _blobUrl: null,

    get masterVolume() {
        return this._masterVolume;
    },

    set masterVolume(value) {
        this._masterVolume = value;
        core.WebAudio.setMasterVolume(this._masterVolume);
        core.Graphics.setVideoVolume(this._masterVolume);
    },

    get bgmVolume() {
        return this._bgmVolume;
    },

    set bgmVolume(value) {
        this._bgmVolume = value;
        this.updateBgmParameters(this._currentBgm);
    },

    get bgsVolume() {
        return this._bgsVolume;
    },

    set bgsVolume(value) {
        this._bgsVolume = value;
        this.updateBgsParameters(this._currentBgs);
    },

    get meVolume() {
        return this._meVolume;
    },

    set meVolume(value) {
        this._meVolume = value;
        this.updateMeParameters(this._currentMe);
    },

    get seVolume() {
        return this._seVolume;
    },

    set seVolume(value) {
        this._seVolume = value;
    },

    playBgm(bgm, pos) {
        if (this.isCurrentBgm(bgm)) {
            this.updateBgmParameters(bgm);
        } else {
            this.stopBgm();
            if (bgm.name) {
                if(core.Decrypter.hasEncryptedAudio && this.shouldUseHtml5Audio()){
                    this.playEncryptedBgm(bgm, pos);
                }
                else {
                    this._bgmBuffer = this.createBuffer('bgm', bgm.name);
                    this.updateBgmParameters(bgm);
                    if (!this._meBuffer) {
                        this._bgmBuffer.play(true, pos || 0);
                    }
                }
            }
        }
        this.updateCurrentBgm(bgm, pos);
    },

    playEncryptedBgm(bgm, pos) {
        var ext = this.audioFileExt();
        var url = this._path + 'bgm/' + encodeURIComponent(bgm.name) + ext;
        url = core.Decrypter.extToEncryptExt(url);
        core.Decrypter.decryptHTML5Audio(url, bgm, pos);
    },

    createDecryptBuffer(url, bgm, pos) {
        this._blobUrl = url;
        this._bgmBuffer = this.createBuffer('bgm', bgm.name);
        this.updateBgmParameters(bgm);
        if (!this._meBuffer) {
            this._bgmBuffer.play(true, pos || 0);
        }
        this.updateCurrentBgm(bgm, pos);
    },

    replayBgm(bgm) {
        if (this.isCurrentBgm(bgm)) {
            this.updateBgmParameters(bgm);
        } else {
            this.playBgm(bgm, bgm.pos);
            if (this._bgmBuffer) {
                this._bgmBuffer.fadeIn(this._replayFadeTime);
            }
        }
    },

    isCurrentBgm(bgm) {
        return (this._currentBgm && this._bgmBuffer &&
                this._currentBgm.name === bgm.name);
    },

    updateBgmParameters(bgm) {
        this.updateBufferParameters(this._bgmBuffer, this._bgmVolume, bgm);
    },

    updateCurrentBgm(bgm, pos) {
        this._currentBgm = {
            name: bgm.name,
            volume: bgm.volume,
            pitch: bgm.pitch,
            pan: bgm.pan,
            pos: pos
        };
    },

    stopBgm() {
        if (this._bgmBuffer) {
            this._bgmBuffer.stop();
            this._bgmBuffer = null;
            this._currentBgm = null;
        }
    },

    fadeOutBgm(duration) {
        if (this._bgmBuffer && this._currentBgm) {
            this._bgmBuffer.fadeOut(duration);
            this._currentBgm = null;
        }
    },

    fadeInBgm(duration) {
        if (this._bgmBuffer && this._currentBgm) {
            this._bgmBuffer.fadeIn(duration);
        }
    },

    playBgs(bgs, pos) {
        if (this.isCurrentBgs(bgs)) {
            this.updateBgsParameters(bgs);
        } else {
            this.stopBgs();
            if (bgs.name) {
                this._bgsBuffer = this.createBuffer('bgs', bgs.name);
                this.updateBgsParameters(bgs);
                this._bgsBuffer.play(true, pos || 0);
            }
        }
        this.updateCurrentBgs(bgs, pos);
    },

    replayBgs(bgs) {
        if (this.isCurrentBgs(bgs)) {
            this.updateBgsParameters(bgs);
        } else {
            this.playBgs(bgs, bgs.pos);
            if (this._bgsBuffer) {
                this._bgsBuffer.fadeIn(this._replayFadeTime);
            }
        }
    },

    isCurrentBgs(bgs) {
        return (this._currentBgs && this._bgsBuffer &&
                this._currentBgs.name === bgs.name);
    },

    updateBgsParameters(bgs) {
        this.updateBufferParameters(this._bgsBuffer, this._bgsVolume, bgs);
    },

    updateCurrentBgs(bgs, pos) {
        this._currentBgs = {
            name: bgs.name,
            volume: bgs.volume,
            pitch: bgs.pitch,
            pan: bgs.pan,
            pos: pos
        };
    },

    stopBgs() {
        if (this._bgsBuffer) {
            this._bgsBuffer.stop();
            this._bgsBuffer = null;
            this._currentBgs = null;
        }
    },

    fadeOutBgs(duration) {
        if (this._bgsBuffer && this._currentBgs) {
            this._bgsBuffer.fadeOut(duration);
            this._currentBgs = null;
        }
    },

    fadeInBgs(duration) {
        if (this._bgsBuffer && this._currentBgs) {
            this._bgsBuffer.fadeIn(duration);
        }
    },

    playMe(me) {
        this.stopMe();
        if (me.name) {
            if (this._bgmBuffer && this._currentBgm) {
                this._currentBgm.pos = this._bgmBuffer.seek();
                this._bgmBuffer.stop();
            }
            this._meBuffer = this.createBuffer('me', me.name);
            this.updateMeParameters(me);
            this._meBuffer.play(false);
            this._meBuffer.addStopListener(this.stopMe.bind(this));
        }
    },

    updateMeParameters(me) {
        this.updateBufferParameters(this._meBuffer, this._meVolume, me);
    },

    fadeOutMe(duration) {
        if (this._meBuffer) {
            this._meBuffer.fadeOut(duration);
        }
    },

    stopMe() {
        if (this._meBuffer) {
            this._meBuffer.stop();
            this._meBuffer = null;
            if (this._bgmBuffer && this._currentBgm && !this._bgmBuffer.isPlaying()) {
                this._bgmBuffer.play(true, this._currentBgm.pos);
                this._bgmBuffer.fadeIn(this._replayFadeTime);
            }
        }
    },

    playSe(se) {
        if (se.name) {
            this._seBuffers = this._seBuffers.filter(function(audio) {
                return audio.isPlaying();
            });
            var buffer = this.createBuffer('se', se.name);
            this.updateSeParameters(buffer, se);
            buffer.play(false);
            this._seBuffers.push(buffer);
        }
    },

    updateSeParameters(buffer, se) {
        this.updateBufferParameters(buffer, this._seVolume, se);
    },

    stopSe() {
        this._seBuffers.forEach(function(buffer) {
            buffer.stop();
        });
        this._seBuffers = [];
    },

    playStaticSe(se) {
        if (se.name) {
            this.loadStaticSe(se);
            for (var i = 0; i < this._staticBuffers.length; i++) {
                var buffer = this._staticBuffers[i];
                if (buffer._reservedSeName === se.name) {
                    buffer.stop();
                    this.updateSeParameters(buffer, se);
                    buffer.play(false);
                    break;
                }
            }
        }
    },

    loadStaticSe(se) {
        if (se.name && !this.isStaticSe(se)) {
            var buffer = this.createBuffer('se', se.name);
            buffer._reservedSeName = se.name;
            this._staticBuffers.push(buffer);
            if (this.shouldUseHtml5Audio()) {
                core.Html5Audio.setStaticSe(buffer._url);
            }
        }
    },

    isStaticSe(se) {
        for (var i = 0; i < this._staticBuffers.length; i++) {
            var buffer = this._staticBuffers[i];
            if (buffer._reservedSeName === se.name) {
                return true;
            }
        }
        return false;
    },

    stopAll() {
        this.stopMe();
        this.stopBgm();
        this.stopBgs();
        this.stopSe();
    },

    saveBgm() {
        if (this._currentBgm) {
            var bgm = this._currentBgm;
            return {
                name: bgm.name,
                volume: bgm.volume,
                pitch: bgm.pitch,
                pan: bgm.pan,
                pos: this._bgmBuffer ? this._bgmBuffer.seek() : 0
            };
        } else {
            return this.makeEmptyAudioObject();
        }
    },

    saveBgs() {
        if (this._currentBgs) {
            var bgs = this._currentBgs;
            return {
                name: bgs.name,
                volume: bgs.volume,
                pitch: bgs.pitch,
                pan: bgs.pan,
                pos: this._bgsBuffer ? this._bgsBuffer.seek() : 0
            };
        } else {
            return this.makeEmptyAudioObject();
        }
    },

    makeEmptyAudioObject() {
        return { name: '', volume: 0, pitch: 0 };
    },

    createBuffer(folder, name) {
        var ext = this.audioFileExt();
        var url = this._path + folder + '/' + encodeURIComponent(name) + ext;
        if (this.shouldUseHtml5Audio() && folder === 'bgm') {
            if(this._blobUrl) core.Html5Audio.setup(this._blobUrl);
            else core.Html5Audio.setup(url);
            return core.Html5Audio;
        } else {
            var audio = new core.WebAudio(url);
            this._callCreationHook(audio);
            return audio;
        }
    },

    updateBufferParameters(buffer, configVolume, audio) {
        if (buffer && audio) {
            buffer.volume = configVolume * (audio.volume || 0) / 10000;
            buffer.pitch = (audio.pitch || 0) / 100;
            buffer.pan = (audio.pan || 0) / 100;
        }
    },

    audioFileExt() {
        if (core.WebAudio.canPlayOgg() && !core.Utils.isMobileDevice()) {
            return '.ogg';
        } else {
            return '.m4a';
        }
    },

    shouldUseHtml5Audio() {
        // The only case where we wanted html5audio was android/ no encrypt
        // Atsuma-ru asked to force webaudio there too, so just return false for ALL    // return Utils.isAndroidChrome() && !Decrypter.hasEncryptedAudio;
     return false;
    },

    checkErrors() {
        this.checkWebAudioError(this._bgmBuffer);
        this.checkWebAudioError(this._bgsBuffer);
        this.checkWebAudioError(this._meBuffer);
        this._seBuffers.forEach(function(buffer) {
            this.checkWebAudioError(buffer);
        }.bind(this));
        this._staticBuffers.forEach(function(buffer) {
            this.checkWebAudioError(buffer);
        }.bind(this));
    },

    checkWebAudioError(webAudio) {
        if (webAudio && webAudio.isError()) {
            throw new Error('Failed to load: ' + webAudio.url);
        }
    },

    setCreationHook(hook) {
        this._creationHook = hook;
    },

    _callCreationHook(audio) {
        if(this._creationHook) this._creationHook(audio);
    },
};

export {AudioManager};
