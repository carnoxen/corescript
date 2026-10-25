//-----------------------------------------------------------------------------
/**
 * The static class that defines utility methods.
 *
 * @class Utils
 */
const Utils = {
    /**
     * The name of the RPG Maker. 'MV' in the current version.
     *
     * @static
     * @property RPGMAKER_NAME
     * @type String
     * @final
     */
    RPGMAKER_NAME: 'MV',

    /**
     * The version of the RPG Maker.
     *
     * @static
     * @property RPGMAKER_VERSION
     * @type String
     * @final
     */
    RPGMAKER_VERSION: "1.6.1",

    RPGMAKER_ENGINE: "community-1.3b",

    /**
     * Checks whether the option is in the query string.
     *
     * @static
     * @method isOptionValid
     * @param {String} name The option name
     * @return {Boolean} True if the option is in the query string
     */
    isOptionValid(name) {
        if (location.search.slice(1).split('&').contains(name)) {
            return true;
        }
        if (typeof nw !== "undefined" &&
            nw.App.argv.length > 0 &&
            nw.App.argv[0].split('&').contains(name)
        ) {
            return true;
        }
        return false;
    },

    /**
     * Checks whether the platform is NW.js.
     *
     * @static
     * @method isNwjs
     * @return {Boolean} True if the platform is NW.js
     */
    isNwjs() {
        return typeof nw !== 'undefined' && typeof process === 'object';
    },

    /**
     * Checks whether the platform is a mobile device.
     *
     * @static
     * @method isMobileDevice
     * @return {Boolean} True if the platform is a mobile device
     */
    isMobileDevice() {
        var r = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        return !!navigator.userAgent.match(r);
    },

    /**
     * Checks whether the browser is Mobile Safari.
     *
     * @static
     * @method isMobileSafari
     * @return {Boolean} True if the browser is Mobile Safari
     */
    isMobileSafari() {
        var agent = navigator.userAgent;
        return !!(agent.match(/iPhone|iPad|iPod/) && agent.match(/AppleWebKit/) &&
                  !agent.match('CriOS'));
    },

    /**
     * Checks whether the browser is Android Chrome.
     *
     * @static
     * @method isAndroidChrome
     * @return {Boolean} True if the browser is Android Chrome
     */
    isAndroidChrome() {
        var agent = navigator.userAgent;
        return !!(agent.match(/Android/) && agent.match(/Chrome/));
    },

    /**
     * Checks whether the browser can read files in the game folder.
     *
     * @static
     * @method canReadGameFiles
     * @return {Boolean} True if the browser can read files in the game folder
     */
    canReadGameFiles() {
        var scripts = document.getElementsByTagName('script');
        var lastScript = scripts[scripts.length - 1];
        var xhr = new XMLHttpRequest();
        try {
            xhr.open('GET', lastScript.src);
            xhr.overrideMimeType('text/javascript');
            xhr.send();
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * Makes a CSS color string from RGB values.
     *
     * @static
     * @method rgbToCssColor
     * @param {Number} r The red value in the range (0, 255)
     * @param {Number} g The green value in the range (0, 255)
     * @param {Number} b The blue value in the range (0, 255)
     * @return {String} CSS color string
     */
    rgbToCssColor(r, g, b) {
        r = Math.round(r);
        g = Math.round(g);
        b = Math.round(b);
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    },

    _id: 1,

    generateRuntimeId() {
        return Utils._id++;
    },

    _supportPassiveEvent: null,

    /**
     * Test this browser support passive event feature
     *
     * @static
     * @method isSupportPassiveEvent
     * @return {Boolean} this browser support passive event or not
     */
    isSupportPassiveEvent() {
        if (typeof Utils._supportPassiveEvent === "boolean") {
            return Utils._supportPassiveEvent;
        }
        // test support passive event
        // https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md#feature-detection
        var passive = false;
        var options = Object.defineProperty({}, "passive", {
            get: function() { passive = true; }
        });
        window.addEventListener("test", null, options);
        Utils._supportPassiveEvent = passive;
        return passive;
    },
};

export {Utils};
