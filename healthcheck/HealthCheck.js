/*:
 * @plugindesc Verify core script integrity in desktop playtests.
 */
export default function install({core, managers, scenes}) {
    (() => {
        const expected = __CRC__;
        const table = Array.from({length: 256}, (_, value) => {
            for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1;
            return value >>> 0;
        });
        const start = scenes.Boot.prototype.start;
        scenes.Boot.prototype.start = function() {
            start.call(this);
            if (!managers.State.$gameTemp.isPlaytest() || !core.Utils.isNwjs()) return;
            const {fs, path} = managers.StorageManager;
            const root = path.dirname((process.mainModule?.filename ?? path.join(nw.App.startPath, 'index.html')));
            for (const [file, checksum] of Object.entries(expected)) {
                let crc = -1;
                for (const byte of fs.readFileSync(path.join(root, file))) crc = table[(crc ^ byte) & 255] ^ crc >>> 8;
                if ((crc ^ -1) !== checksum) throw new Error(`${file} is not valid.`);
            }
        };
    })();
}
