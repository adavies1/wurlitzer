export function readStringFromArrayBuffer(arrayBuffer, start, end) {
    return String.fromCharCode.apply(
        null,
        new Uint8Array(arrayBuffer.slice(start, end))
    );
};

export function readBigEndian16bitInt(arrayBuffer, offset) {
    return new DataView(arrayBuffer).getUint16(offset, false);
};

export function readBigEndian8bitInt(arrayBuffer, offset) {
    return new DataView(arrayBuffer).getUint8(offset, false);
};