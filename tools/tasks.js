import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import concat from '../concat.js';
import copy from '../copy-all.js';
import crc32 from './crc32.js';
import {modules} from './layout.js';
import generateCRC from '../healthcheck/generate_crc.js';
import {isMain} from './paths.js';

export function zip(root = 'corescript', target = 'corescript.zip') {
    const local = [], central = [];
    let offset = 0, count = 0;
    function walk(folder) {
        for (const entry of fs.readdirSync(folder, {withFileTypes: true})) {
            const file = path.join(folder, entry.name);
            if (entry.isDirectory()) { walk(file); continue; }
            const name = Buffer.from(file.replaceAll('\\', '/'));
            const data = fs.readFileSync(file), crc = crc32(data);
            const header = Buffer.alloc(30);
            header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x800, 6);
            header.writeUInt16LE(33, 12); header.writeUInt32LE(crc, 14);
            header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(name.length, 26);
            local.push(header, name, data);
            const directory = Buffer.alloc(46);
            directory.writeUInt32LE(0x02014b50); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6);
            directory.writeUInt16LE(0x800, 8); directory.writeUInt16LE(33, 14); directory.writeUInt32LE(crc, 16);
            directory.writeUInt32LE(data.length, 20); directory.writeUInt32LE(data.length, 24);
            directory.writeUInt16LE(name.length, 28); directory.writeUInt32LE(offset, 42);
            central.push(directory, name); offset += header.length + name.length + data.length; count++;
        }
    }
    walk(root);
    const directory = Buffer.concat(central), end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50); end.writeUInt16LE(count, 8); end.writeUInt16LE(count, 10);
    end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
    fs.writeFileSync(target, Buffer.concat([...local, directory, end]));
}

export function serve(root = 'game', port = Number(process.env.PORT ?? 8080)) {
    root = fs.realpathSync(root);
    const mime = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
        '.css': 'text/css', '.png': 'image/png', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.woff': 'font/woff', '.ttf': 'font/ttf'};
    const server = createServer((request, response) => {
        try {
            const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
            let file = fs.realpathSync(path.join(root, pathname));
            const relative = path.relative(root, file);
            if (relative.startsWith('..') || path.isAbsolute(relative)) { response.writeHead(403).end(); return; }
            if (fs.statSync(file).isDirectory()) file = fs.realpathSync(path.join(file, 'index.html'));
            const resolved = path.relative(root, file);
            if (resolved.startsWith('..') || path.isAbsolute(resolved)) { response.writeHead(403).end(); return; }
            response.writeHead(200, {'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store'});
            const stream = fs.createReadStream(file);
            stream.on('error', () => response.destroy()); stream.pipe(response);
        } catch { response.writeHead(404).end('Not found'); }
    });
    server.listen(port, '127.0.0.1', () => console.log(`http://localhost:${server.address().port}/`));
    return server;
}

if (isMain(import.meta.url)) {
    const task = process.argv[2];
    const build = () => concat(modules[0], true);
    const tasks = {
        build,
        copy: () => copy('game'),
        test: () => { build(); copy('game'); },
        zip,
        start: () => serve(process.argv[3]),
        package: () => { build(); copy(); generateCRC(); zip(); }
    };
    if (!tasks[task]) throw new Error(`Unknown task: ${task}`);
    tasks[task]();
}
