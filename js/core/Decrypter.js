import * as core from './index.js';
import * as managers from '../managers/index.js';

const Decrypter = {
    hasEncryptedImages: false,

    hasEncryptedAudio: false,

    _requestImgFile: [],

    _headerlength: 16,

    _xhrOk: 400,

    _encryptionKey: "",

    _ignoreList: [
        "img/system/Window.png"
    ],

    SIGNATURE: "5250474d56000000",

    VER: "000301",

    REMAIN: "0000000000",

    checkImgIgnore(url) {
        for(var cnt = 0; cnt < this._ignoreList.length; cnt++) {
            if(url === this._ignoreList[cnt]) return true;
        }
        return false;
    },

    decryptImg(url, bitmap) {
        url = this.extToEncryptExt(url);

        var requestFile = new XMLHttpRequest();
        requestFile.open("GET", url);
        requestFile.responseType = "arraybuffer";
        requestFile.send();

        requestFile.onload = function () {
            if(this.status < Decrypter._xhrOk) {
                var arrayBuffer = Decrypter.decryptArrayBuffer(requestFile.response);
                bitmap._image.src = Decrypter.createBlobUrl(arrayBuffer);
                bitmap._image.addEventListener('load', bitmap._loadListener = core.Bitmap.prototype._onLoad.bind(bitmap));
                bitmap._image.addEventListener('error', bitmap._errorListener = bitmap._loader || core.Bitmap.prototype._onError.bind(bitmap));
            }
        };

        requestFile.onerror = function () {
            if (bitmap._loader) {
                bitmap._loader();
            } else {
                bitmap._onError();
            }
        };
    },

    decryptHTML5Audio(url, bgm, pos) {
        var requestFile = new XMLHttpRequest();
        requestFile.open("GET", url);
        requestFile.responseType = "arraybuffer";
        requestFile.send();

        requestFile.onload = function () {
            if(this.status < Decrypter._xhrOk) {
                var arrayBuffer = Decrypter.decryptArrayBuffer(requestFile.response);
                var url = Decrypter.createBlobUrl(arrayBuffer);
                managers.AudioManager.createDecryptBuffer(url, bgm, pos);
            }
        };
    },

    cutArrayHeader(arrayBuffer, length) {
        return arrayBuffer.slice(length);
    },

    decryptArrayBuffer(arrayBuffer) {
        if (!arrayBuffer) return null;
        var header = new Uint8Array(arrayBuffer, 0, this._headerlength);

        var i;
        var ref = this.SIGNATURE + this.VER + this.REMAIN;
        var refBytes = new Uint8Array(16);
        for (i = 0; i < this._headerlength; i++) {
            refBytes[i] = parseInt("0x" + ref.substr(i * 2, 2), 16);
        }
        for (i = 0; i < this._headerlength; i++) {
            if (header[i] !== refBytes[i]) {
                throw new Error("Header is wrong");
            }
        }

        arrayBuffer = this.cutArrayHeader(arrayBuffer, Decrypter._headerlength);
        var view = new DataView(arrayBuffer);
        this.readEncryptionkey();
        if (arrayBuffer) {
            var byteArray = new Uint8Array(arrayBuffer);
            for (i = 0; i < this._headerlength; i++) {
                byteArray[i] = byteArray[i] ^ parseInt(Decrypter._encryptionKey[i], 16);
                view.setUint8(i, byteArray[i]);
            }
        }

        return arrayBuffer;
    },

    createBlobUrl(arrayBuffer) {
        var blob = new Blob([arrayBuffer]);
        return window.URL.createObjectURL(blob);
    },

    extToEncryptExt(url) {
        var ext = url.split('.').pop();
        var encryptedExt = ext;

        if(ext === "ogg") encryptedExt = ".rpgmvo";
        else if(ext === "m4a") encryptedExt = ".rpgmvm";
        else if(ext === "png") encryptedExt = ".rpgmvp";
        else encryptedExt = ext;

        return url.slice(0, url.lastIndexOf(ext) - 1) + encryptedExt;
    },

    readEncryptionkey() {
        this._encryptionKey = managers.State.$dataSystem.encryptionKey.split(/(.{2})/).filter(Boolean);
    },
};

export {Decrypter};
