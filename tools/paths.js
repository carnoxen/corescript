import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const isMain = url => !!process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === url;
