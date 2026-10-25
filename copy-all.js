import {cpSync, mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync, unlinkSync} from 'node:fs';
import path from 'node:path';
import {isMain} from './tools/paths.js';
import {importMap} from './tools/layout.js';

const pluginRenames = [['Community_Basic', 'Basic'], ['Debug_FailLoading', 'FailLoading'],
    ['Debug_ReportMemory', 'ReportMemory'], ['Debug_ThrottleImage', 'ThrottleImage']];

export default function copyAll(root = './corescript') {
    mkdirSync(path.join(root, 'js'), {recursive: true});
    for (const file of readdirSync(path.join(root, 'js'))) {
        if (/^rpg_(core|managers|objects|scenes|sprites|windows)\.js(?:\.map)?$/.test(file)) unlinkSync(path.join(root, 'js', file));
    }
    for (const [source, target] of [['template', root], ['dist', `${root}/js`],
        ['plugins', `${root}/js/plugins`], ['js/main.js', `${root}/js/main.js`]]) {
        if (existsSync(source)) cpSync(source, target, {recursive: true, filter: file => path.resolve(file) !== path.resolve('template/plugins.js')});
    }
    if (!existsSync(`${root}/js/plugins.js`)) cpSync('template/plugins.js', `${root}/js/plugins.js`);
    const html = readFileSync('template/index.html', 'utf8').replace('<!-- IMPORT_MAP -->',
        `<script type="importmap">${JSON.stringify(importMap).replaceAll('<', '\\u003c')}</script>`);
    writeFileSync(`${root}/index.html`, html);
    cpSync('importmap.json', `${root}/importmap.json`);
    // Remove previous copies of renamed bundled plugins, preserving customized files.
    for (const [oldName, newName] of pluginRenames) {
        const previous = `${root}/js/plugins/${oldName}.js`, current = `plugins/${newName}.js`;
        if (!existsSync(previous)) continue;
        const normalized = pluginRenames.reduce((source, [oldName, newName]) => source.replaceAll(oldName, newName), readFileSync(previous, 'utf8'));
        if (normalized === readFileSync(current, 'utf8')) unlinkSync(previous);
    }
}
if (isMain(import.meta.url)) copyAll(process.argv[2]);
