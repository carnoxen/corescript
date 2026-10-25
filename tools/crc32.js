const table = Array.from({length: 256}, (_, value) => {
    for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1;
    return value >>> 0;
});
export default function crc32(bytes) {
    let crc = -1;
    for (const byte of bytes) crc = table[(crc ^ byte) & 255] ^ crc >>> 8;
    return (crc ^ -1) >>> 0;
};
