import {readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync} from 'node:fs';
import path from 'node:path';
import {modules, readLayout, exportsOf, importMap} from './tools/layout.js';
import {root, isMain} from './tools/paths.js';

// Link source modules into one ESM scope to resolve runtime import cycles.
export function linkSource(source) {
    return source.replace(/^import[^\n]*\n/gm, '\n')
        .replace(/^export \{[^}]*\};?[^\S\n]*$/gm, '')
        .replace(/^export (?=(?:const|let|class|function)\b)/gm, '');
}

export function linkModule(source, namespace) {
    return `Object.assign(${namespace}, (() => {\n${linkSource(source)}\nreturn {${exportsOf(source).join(', ')}};\n})());\n`;
}

export default function build(name = modules[0], sourceMap = true) {
    if (!modules.includes(name)) throw new Error(`Unknown engine module: ${name}`);
    const {groups, files} = readLayout();
    const sections = [], chunks = [];
    const prelude = `const ${modules.map(name => `${name} = {}`).join(', ')};\n`;
    let line = 2;
    const directory = path.join(root, 'dist');
    mkdirSync(directory, {recursive: true});
    for (const file of readdirSync(directory)) {
        if (/^rpg_(core|managers|objects|scenes|sprites|windows)\.js(?:\.map)?$/.test(file)) unlinkSync(path.join(directory, file));
    }
    for (const file of files) {
        const original = readFileSync(path.join(root, file), 'utf8').trimEnd() + '\n';
        const group = groups.find(group => group.files.includes(file));
        const source = linkModule(original, group.name);
        sections.push({offset: {line, column: 0}, map: {version: 3, sources: [`../${file}`],
                sourcesContent: [original], names: [], mappings: linkSource(original).trimEnd().split('\n').map((_, i) => i ? 'AACA' : 'AAAA').join(';')}});
        line += source.split('\n').length;
        chunks.push(source);
    }
    for (const group of groups) {
        const names = group.files.flatMap(file => exportsOf(readFileSync(path.join(root, file), 'utf8')));
        const target = path.join(directory, group.output);
        mkdirSync(path.dirname(target), {recursive: true});
        let engine = path.posix.relative(path.posix.dirname(group.output), 'engine.js');
        if (!engine.startsWith('.')) engine = './' + engine;
        writeFileSync(target, `import {${group.name}} from '${engine}';\nconst {${names.join(', ')}} = ${group.name};\nexport {${names.join(', ')}};\n`);
    }
    const legacyPrefixes = {objects: 'Game_', scenes: 'Scene_', sprites: 'Sprite_', windows: 'Window_', sets: 'Spriteset_'};
    const registry = modules.map(name => `core.JsonEx.registerNamespace('${name}', ${name}, '${legacyPrefixes[name] ?? ''}');`).join('\n');
    const freeze = modules.map(name => `Object.freeze(${name});`).join('\n');
    let source = prelude + chunks.join('\n') + `\n${registry}\n${freeze}\nexport {${modules.join(', ')}};\n`;
    if (sourceMap) {
        writeFileSync(path.join(directory, 'engine.js.map'), JSON.stringify({version: 3, file: 'engine.js', sections}));
        source += '//# sourceMappingURL=engine.js.map\n';
    }
    writeFileSync(path.join(directory, 'engine.js'), source);
    writeFileSync(path.join(directory, 'importmap.json'), JSON.stringify(importMap, null, 2) + '\n');
}
if (isMain(import.meta.url)) build(process.argv[2], true);
