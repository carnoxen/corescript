import * as engine from 'engine';
import plugins from './plugins.js';

async function start() {
    try {
        await engine.managers.PluginManager.setup(plugins, engine);
        await engine.managers.SceneManager.run(engine.scenes.Boot);
    } catch (error) {
        if (engine.core.Graphics._errorPrinter) engine.managers.SceneManager.catchException(error);
        else {
            console.error(error);
            const message = document.createElement('pre');
            message.textContent = `Failed to start the game: ${error.message}`;
            document.body.appendChild(message);
        }
    }
}
if (document.readyState === 'complete') start();
else window.addEventListener('load', start, {once: true});
