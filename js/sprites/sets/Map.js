import * as core from '../../core/index.js';
import * as managers from '../../managers/index.js';
import * as sets from './index.js';
import * as sprites from '../index.js';

//-----------------------------------------------------------------------------
// Map
//
// The set of sprites on the map screen.
class Map extends sets.Base {
    initialize() {
        super.initialize();
    }

    createLowerLayer() {
        super.createLowerLayer();
        this.createParallax();
        this.createTilemap();
        this.createCharacters();
        this.createShadow();
        this.createDestination();
        this.createWeather();
    }

    update() {
        super.update();
        this.updateTileset();
        this.updateParallax();
        this.updateTilemap();
        this.updateShadow();
        this.updateWeather();
    }

    hideCharacters() {
        for (var i = 0; i < this._characterSprites.length; i++) {
            var sprite = this._characterSprites[i];
            if (!sprite.isTile()) {
                sprite.hide();
            }
        }
    }

    createParallax() {
        this._parallax = new core.TilingSprite();
        this._parallax.move(0, 0, core.Graphics.width, core.Graphics.height);
        this._baseSprite.addChild(this._parallax);
    }

    createTilemap() {
        if (core.Graphics.isWebGL()) {
            this._tilemap = new core.ShaderTilemap();
        } else {
            this._tilemap = new core.Tilemap();
        }
        this._tilemap.tileWidth = managers.State.$gameMap.tileWidth();
        this._tilemap.tileHeight = managers.State.$gameMap.tileHeight();
        this._tilemap.setData(managers.State.$gameMap.width(), managers.State.$gameMap.height(), managers.State.$gameMap.data());
        this._tilemap.horizontalWrap = managers.State.$gameMap.isLoopHorizontal();
        this._tilemap.verticalWrap = managers.State.$gameMap.isLoopVertical();
        this.loadTileset();
        this._baseSprite.addChild(this._tilemap);
    }

    loadTileset() {
        this._tileset = managers.State.$gameMap.tileset();
        if (this._tileset) {
            var tilesetNames = this._tileset.tilesetNames;
            for (var i = 0; i < tilesetNames.length; i++) {
                this._tilemap.bitmaps[i] = managers.ImageManager.loadTileset(tilesetNames[i]);
            }
            var newTilesetFlags = managers.State.$gameMap.tilesetFlags();
            this._tilemap.refreshTileset();
            if (!this._tilemap.flags.equals(newTilesetFlags)) {
                this._tilemap.refresh();
            }
            this._tilemap.flags = newTilesetFlags;
        }
    }

    createCharacters() {
        this._characterSprites = [];
        managers.State.$gameMap.events().forEach(function(event) {
            this._characterSprites.push(new sprites.Character(event));
        }, this);
        managers.State.$gameMap.vehicles().forEach(function(vehicle) {
            this._characterSprites.push(new sprites.Character(vehicle));
        }, this);
        managers.State.$gamePlayer.followers().reverseEach(function(follower) {
            this._characterSprites.push(new sprites.Character(follower));
        }, this);
        this._characterSprites.push(new sprites.Character(managers.State.$gamePlayer));
        for (var i = 0; i < this._characterSprites.length; i++) {
            this._tilemap.addChild(this._characterSprites[i]);
        }
    }

    createShadow() {
        this._shadowSprite = new core.Sprite();
        this._shadowSprite.bitmap = managers.ImageManager.loadSystem('Shadow1');
        this._shadowSprite.anchor.x = 0.5;
        this._shadowSprite.anchor.y = 1;
        this._shadowSprite.z = 6;
        this._tilemap.addChild(this._shadowSprite);
    }

    createDestination() {
        this._destinationSprite = new sprites.Destination();
        this._destinationSprite.z = 9;
        this._tilemap.addChild(this._destinationSprite);
    }

    createWeather() {
        this._weather = new core.Weather();
        this.addChild(this._weather);
    }

    updateTileset() {
        if (this._tileset !== managers.State.$gameMap.tileset()) {
            this.loadTileset();
        }
    }

    /*
     * Simple fix for canvas parallax issue, destroy old parallax and readd to  the tree.
     */
    _canvasReAddParallax() {
        var index = this._baseSprite.children.indexOf(this._parallax);
        this._baseSprite.removeChild(this._parallax);
        this._parallax = new core.TilingSprite();
        this._parallax.move(0, 0, core.Graphics.width, core.Graphics.height);
        this._parallax.bitmap = managers.ImageManager.loadParallax(this._parallaxName);
        this._baseSprite.addChildAt(this._parallax,index);
    }

    updateParallax() {
        if (this._parallaxName !== managers.State.$gameMap.parallaxName()) {
            this._parallaxName = managers.State.$gameMap.parallaxName();

            if (this._parallax.bitmap && core.Graphics.isWebGL() != true) {
                this._canvasReAddParallax();
            } else {
                this._parallax.bitmap = managers.ImageManager.loadParallax(this._parallaxName);
            }
        }
        if (this._parallax.bitmap) {
            this._parallax.origin.x = managers.State.$gameMap.parallaxOx();
            this._parallax.origin.y = managers.State.$gameMap.parallaxOy();
        }
    }

    updateTilemap() {
        this._tilemap.origin.x = managers.State.$gameMap.displayX() * managers.State.$gameMap.tileWidth();
        this._tilemap.origin.y = managers.State.$gameMap.displayY() * managers.State.$gameMap.tileHeight();
    }

    updateShadow() {
        var airship = managers.State.$gameMap.airship();
        this._shadowSprite.x = airship.shadowX();
        this._shadowSprite.y = airship.shadowY();
        this._shadowSprite.opacity = airship.shadowOpacity();
    }

    updateWeather() {
        this._weather.type = managers.State.$gameScreen.weatherType();
        this._weather.power = managers.State.$gameScreen.weatherPower();
        this._weather.origin.x = managers.State.$gameMap.displayX() * managers.State.$gameMap.tileWidth();
        this._weather.origin.y = managers.State.$gameMap.displayY() * managers.State.$gameMap.tileHeight();
    }
}

export {Map};
