const PluginManager = {
    _path: 'js/plugins/',
    _scripts: [],
    _errorUrls: [],
    _parameters: {},

    async setup(plugins, runtime) {
        for (const plugin of plugins) {
            if (!plugin.status || this._scripts.includes(plugin.name)) continue;
            this.setParameters(plugin.name, plugin.parameters);
            await this.loadScript(`${plugin.name}.js`, runtime);
            this._scripts.push(plugin.name);
        }
    },

    checkErrors() {
        const url = this._errorUrls.shift();
        if (url) throw new Error(`Failed to load: ${url}`);
    },

    parameters(name) { return this._parameters[name.toLowerCase()] ?? {}; },
    setParameters(name, parameters) { this._parameters[name.toLowerCase()] = parameters; },

    async loadScript(name, runtime) {
        const url = new URL(this._path + name, document.baseURI).href;
        try {
            const plugin = await import(url);
            if (typeof plugin.default !== 'function') throw new TypeError(`${name} must export a default installer`);
            await plugin.default(runtime);
        } catch (error) {
            this._errorUrls.push(url);
            throw error;
        }
    }
};

export {PluginManager};
