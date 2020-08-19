export function createAudioContext(): AudioContext {
    return typeof window  !== 'undefined'
        ? new (window.AudioContext || (window as any).webkitAudioContext)()
        : globalThis as unknown as AudioContext;
}

export async function loadFile(source: string | File): Promise<ArrayBuffer> {
    return (typeof source === 'string' ? loadFileFromUrl(source) : loadFileFromDisk(source))
}

export function loadFileFromDisk(source: File): Promise<ArrayBuffer> {
    return new Promise((resolve: Function, reject: Function) => {
        const reader = new FileReader;

        reader.onload = () => {
            resolve(reader.result as ArrayBuffer);
        };
        reader.onerror = () => {
            reject("TIMEOUT");
        };
        reader.onabort = () => {
            reject('ABORT');
        };

        console.log(`[INFO] Attempting to read file:`, source);
        reader.readAsArrayBuffer(source);
    });
}

export function loadFileFromUrl(source: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        req.open('GET', source, true);
        req.responseType = 'arraybuffer';

        req.onload = () => {
            if(req.response) {
                resolve(req.response);
            }
            else {
                reject("EMPTY");
            }
        }
        req.onerror = function() {
            reject("ERROR");
        };
        req.ontimeout = function() {
            reject("TIMEOUT");
        };
        req.onabort = function() {
            reject('ABORT');
        };

        console.log(`[INFO] Attempting to read file from URL: '${source}'`);
        req.send();
    });
};

export function pickRandom(...params: any[]) {
    return params[randomInt(params.length)];
}

/**
 * Given a max of 3, it will return 0,1,2
 */
export function randomInt(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
}

export function read8bitInt(arrayBuffer: ArrayBuffer, offset: number) {
    return new DataView(arrayBuffer).getUint8(offset);
};

export function readBigEndian16bitInt(arrayBuffer: ArrayBuffer, offset: number) {
    return new DataView(arrayBuffer).getUint16(offset, false);
};

export function readStringFromArrayBuffer(arrayBuffer: ArrayBuffer, start: number, end?: number) {
    return String.fromCharCode.apply(
        null,
        Array.from(new Uint8Array(arrayBuffer.slice(start, end)))
    );
};
