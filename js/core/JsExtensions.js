// Small MV API aliases backed by modern JavaScript built-ins.
Number.prototype.clamp = function(min, max) { return Math.min(Math.max(this, min), max); };
Number.prototype.mod = function(n) { return ((this % n) + n) % n; };
String.prototype.format = function(...args) { return this.replace(/%([0-9]+)/g, (_, n) => args[Number(n) - 1]); };
String.prototype.padZero = function(length) { return String(this).padStart(length, '0'); };
Number.prototype.padZero = function(length) { return String(this).padStart(length, '0'); };
String.prototype.contains = function(value) { return this.includes(value); };
Math.randomInt = max => Math.floor(max * Math.random());
Object.defineProperties(Array.prototype, Object.fromEntries(Object.entries({
    equals: {value(array) {
        return !!array && this.length === array.length && this.every((value, i) =>
            Array.isArray(value) && Array.isArray(array[i]) ? value.equals(array[i]) : value === array[i]);
    }},
    clone: {value() { return [...this]; }},
    contains: {value(value) { return this.indexOf(value) >= 0; }}
}).filter(([name]) => !Object.hasOwn(Array.prototype, name))));
