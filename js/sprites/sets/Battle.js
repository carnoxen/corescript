import * as core from '../../core/index.js';
import * as managers from '../../managers/index.js';
import * as sets from './index.js';
import * as sprites from '../index.js';

//-----------------------------------------------------------------------------
// Battle
//
// The set of sprites on the battle screen.
class Battle extends sets.Base {
    initialize() {
        super.initialize();
        this._battlebackLocated = false;
    }

    createLowerLayer() {
        super.createLowerLayer();
        this.createBackground();
        this.createBattleField();
        this.createBattleback();
        this.createEnemies();
        this.createActors();
    }

    createBackground() {
        this._backgroundSprite = new core.Sprite();
        this._backgroundSprite.bitmap = managers.SceneManager.backgroundBitmap();
        this._baseSprite.addChild(this._backgroundSprite);
    }

    update() {
        super.update();
        this.updateActors();
        this.updateBattleback();
    }

    createBattleField() {
        var width = core.Graphics.boxWidth;
        var height = core.Graphics.boxHeight;
        var x = (core.Graphics.width - width) / 2;
        var y = (core.Graphics.height - height) / 2;
        this._battleField = new core.Sprite();
        this._battleField.setFrame(x, y, width, height);
        this._battleField.x = x;
        this._battleField.y = y;
        this._baseSprite.addChild(this._battleField);
    }

    createBattleback() {
        var margin = 32;
        var x = -this._battleField.x - margin;
        var y = -this._battleField.y - margin;
        var width = core.Graphics.width + margin * 2;
        var height = core.Graphics.height + margin * 2;
        this._back1Sprite = new core.TilingSprite();
        this._back2Sprite = new core.TilingSprite();
        this._back1Sprite.bitmap = this.battleback1Bitmap();
        this._back2Sprite.bitmap = this.battleback2Bitmap();
        this._back1Sprite.move(x, y, width, height);
        this._back2Sprite.move(x, y, width, height);
        this._battleField.addChild(this._back1Sprite);
        this._battleField.addChild(this._back2Sprite);
    }

    updateBattleback() {
        if (!this._battlebackLocated) {
            this.locateBattleback();
            this._battlebackLocated = true;
        }
    }

    locateBattleback() {
        var width = this._battleField.width;
        var height = this._battleField.height;
        var sprite1 = this._back1Sprite;
        var sprite2 = this._back2Sprite;
        sprite1.origin.x = sprite1.x + (sprite1.bitmap.width - width) / 2;
        sprite2.origin.x = sprite1.y + (sprite2.bitmap.width - width) / 2;
        if (managers.State.$gameSystem.isSideView()) {
            sprite1.origin.y = sprite1.x + sprite1.bitmap.height - height;
            sprite2.origin.y = sprite1.y + sprite2.bitmap.height - height;
        }
    }

    battleback1Bitmap() {
        return managers.ImageManager.loadBattleback1(this.battleback1Name());
    }

    battleback2Bitmap() {
        return managers.ImageManager.loadBattleback2(this.battleback2Name());
    }

    battleback1Name() {
        if (managers.BattleManager.isBattleTest()) {
            return managers.State.$dataSystem.battleback1Name;
        } else if (managers.State.$gameMap.battleback1Name()) {
            return managers.State.$gameMap.battleback1Name();
        } else if (managers.State.$gameMap.isOverworld()) {
            return this.overworldBattleback1Name();
        } else {
            return '';
        }
    }

    battleback2Name() {
        if (managers.BattleManager.isBattleTest()) {
            return managers.State.$dataSystem.battleback2Name;
        } else if (managers.State.$gameMap.battleback2Name()) {
            return managers.State.$gameMap.battleback2Name();
        } else if (managers.State.$gameMap.isOverworld()) {
            return this.overworldBattleback2Name();
        } else {
            return '';
        }
    }

    overworldBattleback1Name() {
        if (managers.State.$gameMap.battleback1Name() === '') return '';
        if (managers.State.$gamePlayer.isInVehicle()) {
            return this.shipBattleback1Name();
        } else {
            return this.normalBattleback1Name();
        }
    }

    overworldBattleback2Name() {
        if (managers.State.$gameMap.battleback2Name() === '') return '';
        if (managers.State.$gamePlayer.isInVehicle()) {
            return this.shipBattleback2Name();
        } else {
            return this.normalBattleback2Name();
        }
    }

    normalBattleback1Name() {
        return (this.terrainBattleback1Name(this.autotileType(1)) ||
                this.terrainBattleback1Name(this.autotileType(0)) ||
                this.defaultBattleback1Name());
    }

    normalBattleback2Name() {
        return (this.terrainBattleback2Name(this.autotileType(1)) ||
                this.terrainBattleback2Name(this.autotileType(0)) ||
                this.defaultBattleback2Name());
    }

    terrainBattleback1Name(type) {
        switch (type) {
        case 24: case 25:
            return 'Wasteland';
        case 26: case 27:
            return 'DirtField';
        case 32: case 33:
            return 'Desert';
        case 34:
            return 'Lava1';
        case 35:
            return 'Lava2';
        case 40: case 41:
            return 'Snowfield';
        case 42:
            return 'Clouds';
        case 4: case 5:
            return 'PoisonSwamp';
        default:
            return null;
        }
    }

    terrainBattleback2Name(type) {
        switch (type) {
        case 20: case 21:
            return 'Forest';
        case 22: case 30: case 38:
            return 'Cliff';
        case 24: case 25: case 26: case 27:
            return 'Wasteland';
        case 32: case 33:
            return 'Desert';
        case 34: case 35:
            return 'Lava';
        case 40: case 41:
            return 'Snowfield';
        case 42:
            return 'Clouds';
        case 4: case 5:
            return 'PoisonSwamp';
        }
    }

    defaultBattleback1Name() {
        return 'Grassland';
    }

    defaultBattleback2Name() {
        return 'Grassland';
    }

    shipBattleback1Name() {
        return 'Ship';
    }

    shipBattleback2Name() {
        return 'Ship';
    }

    autotileType(z) {
        return managers.State.$gameMap.autotileType(managers.State.$gamePlayer.x, managers.State.$gamePlayer.y, z);
    }

    createEnemies() {
        var enemies = managers.State.$gameTroop.members();
        var sprites = [];
        for (var i = 0; i < enemies.length; i++) {
            sprites[i] = new sprites.Enemy(enemies[i]);
        }
        sprites.sort(this.compareEnemySprite.bind(this));
        for (var j = 0; j < sprites.length; j++) {
            this._battleField.addChild(sprites[j]);
        }
        this._enemySprites = sprites;
    }

    compareEnemySprite(a, b) {
        if (a.y !== b.y) {
            return a.y - b.y;
        } else {
            return b.spriteId - a.spriteId;
        }
    }

    createActors() {
        this._actorSprites = [];
        for (var i = 0; i < managers.State.$gameParty.maxBattleMembers(); i++) {
            this._actorSprites[i] = new sprites.Actor();
            this._battleField.addChild(this._actorSprites[i]);
        }
    }

    updateActors() {
        var members = managers.State.$gameParty.battleMembers();
        for (var i = 0; i < this._actorSprites.length; i++) {
            this._actorSprites[i].setBattler(members[i]);
        }
    }

    battlerSprites() {
        return this._enemySprites.concat(this._actorSprites);
    }

    isAnimationPlaying() {
        return this.battlerSprites().some(function(sprite) {
            return sprite.isAnimationPlaying();
        });
    }

    isEffecting() {
        return this.battlerSprites().some(function(sprite) {
            return sprite.isEffecting();
        });
    }

    isAnyoneMoving() {
        return this.battlerSprites().some(function(sprite) {
            return sprite.isMoving();
        });
    }

    isBusy() {
        return this.isAnimationPlaying() || this.isAnyoneMoving();
    }
}

export {Battle};
