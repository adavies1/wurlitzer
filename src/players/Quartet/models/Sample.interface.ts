export interface Sample {
    bitsPerSample: number;
    frequency: number;
    headerExtra: string;
    isStereo: boolean;
    isSigned: boolean;
    isLooping: boolean;
    loopEnd: number;
    loopStart: number;
    midiNote: string;
    name: string;
    nameExtension: string;
    quartetCustom: {
        sampleCount: number;
    }
    sampleCount: number;
    samples: Float32Array;
    signature: string;
}