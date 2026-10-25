import fs from 'node:fs';
import path from 'node:path';
import crc32 from '../tools/crc32.js';
import {importMap} from '../tools/layout.js';
import {isMain} from '../tools/paths.js';

export default function generateCRC() {
    const crc = Object.fromEntries(Object.values(importMap.imports).map(target => {
        const file = target.slice(2);
        return [file, crc32(fs.readFileSync(path.join('corescript', file))) | 0];
    }));
    const plugin = fs.readFileSync('healthcheck/HealthCheck.js', 'utf8').replace('__CRC__', JSON.stringify(crc));
    fs.mkdirSync('corescript/js/plugins', {recursive: true});
    const previous = 'corescript/js/plugins/Debug_HealthCheck.js';
    if (fs.existsSync(previous)) fs.unlinkSync(previous);
    fs.writeFileSync('corescript/js/plugins/HealthCheck.js', plugin);
}

if (isMain(import.meta.url)) generateCRC();
