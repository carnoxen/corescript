// Versioned, readable saves. Legacy compressed saves fail before backup or overwrite.
const SaveCodec = {
    prefix: 'RPGJSON1\n',
    encode(json) { return this.prefix + json; },
    decode(data) {
        if (data == null) return null;
        if (data.startsWith(this.prefix)) return data.slice(this.prefix.length);
        if (/^\s*[\[{]/.test(data)) return data;
        throw new Error('Legacy compressed save detected. Export it as JSON using the original engine before importing it here.');
    }
};

export {SaveCodec};
