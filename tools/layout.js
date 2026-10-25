import {readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {root} from './paths.js';

export const importMap = JSON.parse(readFileSync(path.join(root, 'importmap.json'), 'utf8'));
export const modules = Object.keys(importMap.imports).filter(name => name !== 'engine');

function walk(directory, excluded) {
    return readdirSync(path.join(root, directory), {withFileTypes: true})
        .sort((a, b) => a.name.localeCompare(b.name, 'en'))
        .flatMap(entry => {
            const file = `${directory}/${entry.name}`;
            if (excluded.has(file)) return [];
            return entry.isDirectory() ? walk(file, excluded) : file.endsWith('.js') && entry.name !== 'index.js' ? [file] : [];
        });
}

export function exportsOf(source) {
    return [...source.matchAll(/^export \{([^}]*)\}/gm)].flatMap(match => match[1].split(',').map(name => name.trim()))
        .concat([...source.matchAll(/^export (?:const|let|class|function) (\w+)/gm)].map(match => match[1]));
}

export function readLayout() {
    const groups = modules.map(name => {
        const target = importMap.imports[name];
        if (!/^\.\/js\/(?:[a-z]+\/)*[a-z]+\.js$/.test(target)) throw new Error(`Invalid engine entry: ${target}`);
        const directory = target.slice(2, -3);
        return {name, directory, output: target.slice('./js/'.length)};
    });
    for (const group of groups) group.files = walk(group.directory, new Set(groups.filter(other => other !== group).map(other => other.directory)));
    const source = new Map(groups.flatMap(group => group.files).map(file => [file, readFileSync(path.join(root, file), 'utf8')]));
    const owners = new Map(groups.flatMap(group => group.files.flatMap(file => exportsOf(source.get(file)).map(name => [`${group.name}.${name}`, file]))));
    const ordered = [], active = new Set(), done = new Set();
    function visit(file) {
        if (done.has(file)) return;
        if (active.has(file)) throw new Error(`Circular eager initialization: ${file}`);
        active.add(file);
        const code = source.get(file);
        // Only eager dependencies constrain declaration order. Method imports may cycle.
        const eager = [
            ...[...code.matchAll(/^class \w+ extends ([\w.]+)/gm)].map(match => match[1]),
            ...[...code.matchAll(/^ {4}(?:static )?\w+\s*[:=]\s*([^\n]*)/gm)].map(match => match[1]),
            ...[...code.matchAll(/^if \([^\n]*/gm)].map(match => match[0])
        ].join('\n');
        for (const name of new Set(eager.match(/\b[a-z]+\.[A-Z]\w*/g) ?? [])) {
            const dependency = owners.get(name);
            if (dependency && dependency !== file) visit(dependency);
        }
        active.delete(file); done.add(file); ordered.push(file);
    }
    for (const file of source.keys()) visit(file);
    for (const group of groups) {
        const own = new Set(group.files);
        group.files = ordered.filter(file => own.has(file));
    }
    return {groups, files: ordered};
}
