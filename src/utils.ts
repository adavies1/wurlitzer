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

export function readBigEndian16bitInt(arrayBuffer: ArrayBuffer, offset: number) {
    return new DataView(arrayBuffer).getUint16(offset, false);
};

export function readBigEndian8bitInt(arrayBuffer: ArrayBuffer, offset: number) {
    return new DataView(arrayBuffer).getUint8(offset);
};

export function readStringFromArrayBuffer(arrayBuffer: ArrayBuffer, start: number, end?: number) {
    return String.fromCharCode.apply(
        null,
        new Uint8Array(arrayBuffer.slice(start, end))
    );
};

// For performance reasons, this is not a pure function
export function mergeChannelsToOutput(outputBuffer: AudioBuffer, channels: any[]): void {
    interface ChannelMergeObject {
        mixChannelIndexes: number[],
        mixChannelBuffers: Float32Array[],
        outputBuffer: Float32Array
    }

    const left: ChannelMergeObject = {
        mixChannelIndexes: [channels.length].map((val, idx) => idx),
        mixChannelBuffers: null,
        outputBuffer: outputBuffer.getChannelData(0),
    };
    const right: ChannelMergeObject = {
        mixChannelBuffers: null,
        mixChannelIndexes: [channels.length].map((val, idx) => idx),
        outputBuffer: outputBuffer.getChannelData(1),
    };

    let i: number;
    let mixDivider: number;

    // If song has 4 channels, mimick amiga left/right split (LRRL)
    if(channels.length === 4) {
        left.mixChannelIndexes = [0,3];
        right.mixChannelIndexes = [1,2];
    }
    // Otherwise, just assume the channels alternate (LRLRLR...)
    else {
        left.mixChannelIndexes.filter(channel => channel % 2 === 0);
        right.mixChannelIndexes.filter(channel => channel % 2 !== 0);
    }

    // For performance, cache handles to the buffers for each channel
    [left, right].forEach(speakerChannel => {
        speakerChannel.mixChannelBuffers = speakerChannel.mixChannelIndexes
            .map(channelIndex => channels[channelIndex].getBuffer());
    });

    // This is the number we need to divide by when mixing
    mixDivider = Math.max(left.mixChannelIndexes.length, right.mixChannelIndexes.length);

    // For each stereo channel, loop through samples and mix them into output buffer
    [left, right].forEach(speakerChannel => {
        for(i=0; i<speakerChannel.outputBuffer.length; i++) {
            speakerChannel.outputBuffer[i] = speakerChannel.mixChannelBuffers
                .map(buffer => buffer[i])
                .reduce((prev, val) => prev + val, 0)
                / mixDivider;
        }
    });
};
