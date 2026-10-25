import * as core from '../core/index.js';

//-----------------------------------------------------------------------------
// ImageManager
//
// The static class that loads images, creates bitmap objects and retains them.
const ImageManager = {
    get cache() { return this._cache ??= new core.CacheMap(this); },

    set cache(value) { this._cache = value; },

    _imageCache: new core.ImageCache(),

    _requestQueue: new core.RequestQueue(),

    _systemReservationId: core.Utils.generateRuntimeId(),

    _generateCacheKey(path, hue) {
        return  path + ':' + hue;
    },

    loadAnimation(filename, hue) {
        return this.loadBitmap('img/animations/', filename, hue, true);
    },

    loadBattleback1(filename, hue) {
        return this.loadBitmap('img/battlebacks1/', filename, hue, true);
    },

    loadBattleback2(filename, hue) {
        return this.loadBitmap('img/battlebacks2/', filename, hue, true);
    },

    loadEnemy(filename, hue) {
        return this.loadBitmap('img/enemies/', filename, hue, true);
    },

    loadCharacter(filename, hue) {
        return this.loadBitmap('img/characters/', filename, hue, false);
    },

    loadFace(filename, hue) {
        return this.loadBitmap('img/faces/', filename, hue, true);
    },

    loadParallax(filename, hue) {
        return this.loadBitmap('img/parallaxes/', filename, hue, true);
    },

    loadPicture(filename, hue) {
        return this.loadBitmap('img/pictures/', filename, hue, true);
    },

    loadSvActor(filename, hue) {
        return this.loadBitmap('img/sv_actors/', filename, hue, false);
    },

    loadSvEnemy(filename, hue) {
        return this.loadBitmap('img/sv_enemies/', filename, hue, true);
    },

    loadSystem(filename, hue) {
        return this.loadBitmap('img/system/', filename, hue, false);
    },

    loadTileset(filename, hue) {
        return this.loadBitmap('img/tilesets/', filename, hue, false);
    },

    loadTitle1(filename, hue) {
        return this.loadBitmap('img/titles1/', filename, hue, true);
    },

    loadTitle2(filename, hue) {
        return this.loadBitmap('img/titles2/', filename, hue, true);
    },

    loadBitmap(folder, filename, hue, smooth) {
        if (filename) {
            var path = folder + encodeURIComponent(filename) + '.png';
            var bitmap = this.loadNormalBitmap(path, hue || 0);
            bitmap.smooth = smooth;
            return bitmap;
        } else {
            return this.loadEmptyBitmap();
        }
    },

    loadEmptyBitmap() {
        var empty = this._imageCache.get('empty');
        if(!empty){
            empty = new core.Bitmap();
            this._imageCache.add('empty', empty);
            this._imageCache.reserve('empty', empty, this._systemReservationId);
        }

        return empty;
    },

    loadNormalBitmap(path, hue) {
        var key = this._generateCacheKey(path, hue);
        var bitmap = this._imageCache.get(key);
        if (!bitmap) {
            bitmap = core.Bitmap.load(path);
            this._callCreationHook(bitmap);

            bitmap.addLoadListener(function() {
                bitmap.rotateHue(hue);
            });
            this._imageCache.add(key, bitmap);
        }else if(!bitmap.isReady()){
            bitmap.decode();
        }

        return bitmap;
    },

    clear() {
        this._imageCache = new core.ImageCache();
    },

    isReady() {
        return this._imageCache.isReady();
    },

    isObjectCharacter(filename) {
        var sign = filename.match(/^[\!\$]+/);
        return sign && sign[0].contains('!');
    },

    isBigCharacter(filename) {
        var sign = filename.match(/^[\!\$]+/);
        return sign && sign[0].contains('$');
    },

    isZeroParallax(filename) {
        return filename.charAt(0) === '!';
    },

    reserveAnimation(filename, hue, reservationId) {
        return this.reserveBitmap('img/animations/', filename, hue, true, reservationId);
    },

    reserveBattleback1(filename, hue, reservationId) {
        return this.reserveBitmap('img/battlebacks1/', filename, hue, true, reservationId);
    },

    reserveBattleback2(filename, hue, reservationId) {
        return this.reserveBitmap('img/battlebacks2/', filename, hue, true, reservationId);
    },

    reserveEnemy(filename, hue, reservationId) {
        return this.reserveBitmap('img/enemies/', filename, hue, true, reservationId);
    },

    reserveCharacter(filename, hue, reservationId) {
        return this.reserveBitmap('img/characters/', filename, hue, false, reservationId);
    },

    reserveFace(filename, hue, reservationId) {
        return this.reserveBitmap('img/faces/', filename, hue, true, reservationId);
    },

    reserveParallax(filename, hue, reservationId) {
        return this.reserveBitmap('img/parallaxes/', filename, hue, true, reservationId);
    },

    reservePicture(filename, hue, reservationId) {
        return this.reserveBitmap('img/pictures/', filename, hue, true, reservationId);
    },

    reserveSvActor(filename, hue, reservationId) {
        return this.reserveBitmap('img/sv_actors/', filename, hue, false, reservationId);
    },

    reserveSvEnemy(filename, hue, reservationId) {
        return this.reserveBitmap('img/sv_enemies/', filename, hue, true, reservationId);
    },

    reserveSystem(filename, hue, reservationId) {
        return this.reserveBitmap('img/system/', filename, hue, false, reservationId || this._systemReservationId);
    },

    reserveTileset(filename, hue, reservationId) {
        return this.reserveBitmap('img/tilesets/', filename, hue, false, reservationId);
    },

    reserveTitle1(filename, hue, reservationId) {
        return this.reserveBitmap('img/titles1/', filename, hue, true, reservationId);
    },

    reserveTitle2(filename, hue, reservationId) {
        return this.reserveBitmap('img/titles2/', filename, hue, true, reservationId);
    },

    reserveBitmap(folder, filename, hue, smooth, reservationId) {
        if (filename) {
            var path = folder + encodeURIComponent(filename) + '.png';
            var bitmap = this.reserveNormalBitmap(path, hue || 0, reservationId || this._defaultReservationId);
            bitmap.smooth = smooth;
            return bitmap;
        } else {
            return this.loadEmptyBitmap();
        }
    },

    reserveNormalBitmap(path, hue, reservationId) {
        var bitmap = this.loadNormalBitmap(path, hue);
        this._imageCache.reserve(this._generateCacheKey(path, hue), bitmap, reservationId);

        return bitmap;
    },

    releaseReservation(reservationId) {
        this._imageCache.releaseReservation(reservationId);
    },

    setDefaultReservationId(reservationId) {
        this._defaultReservationId = reservationId;
    },

    requestAnimation(filename, hue) {
        return this.requestBitmap('img/animations/', filename, hue, true);
    },

    requestBattleback1(filename, hue) {
        return this.requestBitmap('img/battlebacks1/', filename, hue, true);
    },

    requestBattleback2(filename, hue) {
        return this.requestBitmap('img/battlebacks2/', filename, hue, true);
    },

    requestEnemy(filename, hue) {
        return this.requestBitmap('img/enemies/', filename, hue, true);
    },

    requestCharacter(filename, hue) {
        return this.requestBitmap('img/characters/', filename, hue, false);
    },

    requestFace(filename, hue) {
        return this.requestBitmap('img/faces/', filename, hue, true);
    },

    requestParallax(filename, hue) {
        return this.requestBitmap('img/parallaxes/', filename, hue, true);
    },

    requestPicture(filename, hue) {
        return this.requestBitmap('img/pictures/', filename, hue, true);
    },

    requestSvActor(filename, hue) {
        return this.requestBitmap('img/sv_actors/', filename, hue, false);
    },

    requestSvEnemy(filename, hue) {
        return this.requestBitmap('img/sv_enemies/', filename, hue, true);
    },

    requestSystem(filename, hue) {
        return this.requestBitmap('img/system/', filename, hue, false);
    },

    requestTileset(filename, hue) {
        return this.requestBitmap('img/tilesets/', filename, hue, false);
    },

    requestTitle1(filename, hue) {
        return this.requestBitmap('img/titles1/', filename, hue, true);
    },

    requestTitle2(filename, hue) {
        return this.requestBitmap('img/titles2/', filename, hue, true);
    },

    requestBitmap(folder, filename, hue, smooth) {
        if (filename) {
            var path = folder + encodeURIComponent(filename) + '.png';
            var bitmap = this.requestNormalBitmap(path, hue || 0);
            bitmap.smooth = smooth;
            return bitmap;
        } else {
            return this.loadEmptyBitmap();
        }
    },

    requestNormalBitmap(path, hue) {
        var key = this._generateCacheKey(path, hue);
        var bitmap = this._imageCache.get(key);
        if(!bitmap){
            bitmap = core.Bitmap.request(path);
            this._callCreationHook(bitmap);

            bitmap.addLoadListener(function(){
                bitmap.rotateHue(hue);
            });
            this._imageCache.add(key, bitmap);
            this._requestQueue.enqueue(key, bitmap);
        }else{
            this._requestQueue.raisePriority(key);
        }

        return bitmap;
    },

    update() {
        this._requestQueue.update();
    },

    clearRequest() {
        this._requestQueue.clear();
    },

    setCreationHook(hook) {
        this._creationHook = hook;
    },

    _callCreationHook(bitmap) {
        if(this._creationHook) this._creationHook(bitmap);
    },
};

export {ImageManager};
