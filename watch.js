import {watch, mkdirSync, cpSync} from 'node:fs';
import build from './concat.js';
import {readLayout} from './tools/layout.js';
mkdirSync('game/js', {recursive: true});
let timer;
for (const {directory} of readLayout().groups) {
    watch(directory, {recursive: true}, () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            try {
                build();
                cpSync('dist', 'game/js', {recursive: true});
                console.log('Updated engine modules');
            } catch (error) { console.error(error.message); }
        }, 75);
    });
}
console.log('Watching engine sources. Ctrl+C to stop.');
