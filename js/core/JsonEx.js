//-----------------------------------------------------------------------------
/**
 * The static class that handles JSON with object information.
 *
 * @class JsonEx
 */
const JsonEx = {
    _constructors: new Map(),
    _names: new WeakMap(),

    register(...constructors) {
        for (const constructor of constructors) {
            if (this._names.has(constructor)) continue;
            this._constructors.set(constructor.name, constructor);
            this._names.set(constructor, constructor.name);
        }
        return this;
    },

    registerNamespace(namespace, values, legacyPrefix = '') {
        for (const [name, constructor] of Object.entries(values)) {
            if (typeof constructor !== 'function' || !constructor.prototype) continue;
            const key = `${namespace}.${name}`;
            this._constructors.set(key, constructor);
            this._constructors.set(legacyPrefix + name, constructor);
            this._names.set(constructor, key);
        }
        return this;
    },
    /**
     * The maximum depth of objects.
     *
     * @static
     * @property maxDepth
     * @type Number
     * @default 100
     */
    maxDepth: 100,

    _id: 1,

    _generateId() {
        return JsonEx._id++;
    },

    /**
     * Converts an object to a JSON string with object information.
     *
     * @static
     * @method stringify
     * @param {Object} object The object to be converted
     * @return {String} The JSON string
     */
    stringify(object) {
        var circular = [];
        JsonEx._id = 1;
        var json = JSON.stringify(this._encode(object, circular, 0));
        this._cleanMetadata(object);
        this._restoreCircularReference(circular);

        return json;
    },

    _restoreCircularReference(circulars) {
        circulars.forEach(function(circular){
            var key = circular[0];
            var value = circular[1];
            var content = circular[2];

            value[key] = content;
        });
    },

    /**
     * Parses a JSON string and reconstructs the corresponding object.
     *
     * @static
     * @method parse
     * @param {String} json The JSON string
     * @return {Object} The reconstructed object
     */
    parse(json) {
        var circular = [];
        var registry = {};
        var contents = this._decode(JSON.parse(json), circular, registry);
        this._cleanMetadata(contents);
        this._linkCircularReference(contents, circular, registry);

        return contents;
    },

    _linkCircularReference(contents, circulars, registry) {
        circulars.forEach(function(circular){
            var key = circular[0];
            var value = circular[1];
            var id = circular[2];

            value[key] = registry[id];
        });
    },

    _cleanMetadata(object) {
        if(!object) return;

        delete object['@'];
        delete object['@c'];

        if(typeof object === 'object'){
            Object.keys(object).forEach(function(key){
                var value = object[key];
                if(typeof value === 'object'){
                    JsonEx._cleanMetadata(value);
                }
            });
        }
    },

    /**
     * Makes a deep copy of the specified object.
     *
     * @static
     * @method makeDeepCopy
     * @param {Object} object The object to be copied
     * @return {Object} The copied object
     */
    makeDeepCopy(object) {
        return this.parse(this.stringify(object));
    },

    /**
     * @static
     * @method _encode
     * @param {Object} value
     * @param {Array} circular
     * @param {Number} depth
     * @return {Object}
     * @private
     */
    _encode(value, circular, depth) {
        depth = depth || 0;
        if (++depth >= this.maxDepth) {
            throw new Error('Object too deep');
        }
        var type = Object.prototype.toString.call(value);
        if (type === '[object Object]' || type === '[object Array]') {
            value['@c'] = JsonEx._generateId();

            var constructorName = this._getConstructorName(value);
            if (constructorName !== 'Object' && constructorName !== 'Array') {
                if (typeof value.constructor === 'function') this.register(value.constructor);
                value['@'] = constructorName;
            }
            for (var key in value) {
                if ((!value.hasOwnProperty || value.hasOwnProperty(key)) && !key.match(/^@./)) {
                    if(value[key] && typeof value[key] === 'object'){
                        if(value[key]['@c']){
                            circular.push([key, value, value[key]]);
                            value[key] = {'@r': value[key]['@c']};
                        }else{
                            value[key] = this._encode(value[key], circular, depth + 1);

                            if(value[key] instanceof Array){
                                //wrap array
                                circular.push([key, value, value[key]]);

                                value[key] = {
                                    '@c': value[key]['@c'],
                                    '@a': value[key]
                                };
                            }
                        }
                    }else{
                        value[key] = this._encode(value[key], circular, depth + 1);
                    }
                }
            }
        }
        depth--;
        return value;
    },

    /**
     * @static
     * @method _decode
     * @param {Object} value
     * @param {Array} circular
     * @param {Object} registry
     * @return {Object}
     * @private
     */
    _decode(value, circular, registry) {
        var type = Object.prototype.toString.call(value);
        if (type === '[object Object]' || type === '[object Array]') {
            registry[value['@c']] = value;

            if (value['@'] === null) {
                value = this._resetPrototype(value, null);
            } else if (value['@']) {
                var constructor = this._constructors.get(value['@']);
                if (constructor) {
                    value = this._resetPrototype(value, constructor.prototype);
                }
            }
            for (var key in value) {
                if (!value.hasOwnProperty || value.hasOwnProperty(key)) {
                    if(value[key] && value[key]['@a']){
                        //object is array wrapper
                        var body = value[key]['@a'];
                        body['@c'] = value[key]['@c'];
                        value[key] = body;
                    }
                    if(value[key] && value[key]['@r']){
                        //object is reference
                        circular.push([key, value, value[key]['@r']])
                    }
                    value[key] = this._decode(value[key], circular, registry);
                }
            }
        }
        return value;
    },

    /**
     * @static
     * @method _getConstructorName
     * @param {Object} value
     * @return {String}
     * @private
     */
    _getConstructorName(value) {
        if (!value.constructor) {
            return null;
        }
        if (this._names.has(value.constructor)) return this._names.get(value.constructor);
        var name = value.constructor.name;
        if (name === undefined) {
            var func = /^\s*function\s*([A-Za-z0-9_$]*)/;
            name = func.exec(value.constructor)[1];
        }
        return name;
    },

    /**
     * @static
     * @method _resetPrototype
     * @param {Object} value
     * @param {Object} prototype
     * @return {Object}
     * @private
     */
    _resetPrototype(value, prototype) {
        if (Object.setPrototypeOf !== undefined) {
            Object.setPrototypeOf(value, prototype);
        } else if ('__proto__' in value) {
            value.__proto__ = prototype;
        } else {
            var newValue = Object.create(prototype);
            for (var key in value) {
                if (value.hasOwnProperty(key)) {
                    newValue[key] = value[key];
                }
            }
            value = newValue;
        }
        return value;
    },
};

export {JsonEx};
