/*:
 * @plugindesc Throttle loading images.
 * @author RM CoreScript team
 *
 * @help
 * This plugin throttle loading.
 * Loading image is delayed by Delay parameter(in ms)
 *
 * @param Delay
 * @default 2000
 */

/*:ja
 * @plugindesc 画像読み込みを遅くします
 * @author RM CoreScript team
 *
 * @help
 * デバッグ用途で、画像読み込みを遅くします。
 *
 * @param Delay
 * @default 2000
 */

export default function install({core, managers}) {
    (function(){
        var parameters = managers.PluginManager.parameters('ThrottleImage');
        var delay = +parameters['Delay'] || 2000;

        var Bitmap_prototype_onLoad = core.Bitmap.prototype._onLoad;
        core.Bitmap.prototype._onLoad = function(){
            setTimeout(Bitmap_prototype_onLoad.bind(this), delay);
        }
    })();
}
