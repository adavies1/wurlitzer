import { EffectCode } from './models/EffectCode.interface';
import { Instruction } from './models/Instruction.interface';
import { Sample } from './models/Sample.interface';
import { SampleHeader } from './models/SampleHeader.interface';

import * as constants from './constants';
import * as utils from '../../utils'

/****************************
 *     Public functions     *
 ****************************/
export function getChannelCount(fileData: ArrayBuffer): number {
    const signature = getSignature(fileData);
    let channelCount: number = 4;

    switch(signature) {
        case '8CHN':
        case 'FLT8':
        case 'CD81':
        case 'OKTA':
        case 'OCTA':
            channelCount = 8;
            break;
        case '6CHN':
            channelCount = 6;
            break;
        case '2CHN':
            channelCount = 2;
            break;
        default:
            if(/^[0-9][0-9]C[H,N]$/.test(signature)) {
                channelCount = parseInt(signature.substr(0,2));
            }
            else if(/^TDZ[0-9]$/.test(signature)) {
                channelCount = parseInt(signature.substr(3));
            }
            else if(/^[579]CHN$/.test(signature)) {
                channelCount = parseInt(signature.substr(0,1));
            }
    }

    return channelCount;
};

export function getFormatDescription(fileData: ArrayBuffer): string {
    const signature = getSignature(fileData);
    let type: string = constants.UNKNOWN_FORMAT;

    switch(signature) {
        case 'M.K.':
            type = 'ProTracker';
            break;
        case 'M!K!':
        case 'M&K!':
            type = 'ProTracker (extended patterns)';
            break;
        case '6CHN':
            type = 'ProTracker (6 channels)';
            break;
        case '8CHN':
            type = 'ProTracker (8 channels)';
            break;
        case '2CHN':
            type = 'FastTracker (2 channels)';
            break;
        case 'CD81':
        case 'OKTA':
            type = 'Oktalyzer';
            break;
        case 'OCTA':
            type = 'Octamed';
            break;
        case 'FLT4':
            type = 'StarTrekker';
            break;
        case 'FLT8':
            type = 'StarTrekker (8 channels)';
            break;
        default:
            if(/^[0-9][0-9]CH$/.test(signature)){
                type = `FastTracker (${parseInt(signature.substr(0,2))} channels)`;
            }
            if(/^[0-9][0-9]CN$/.test(signature)){
                type = `TakeTracker (${parseInt(signature.substr(0,2))} channels)`;
            }
            else if(/^TDZ[0-9]$/.test(signature)){
                type = `TakeTracker (${parseInt(signature.substr(3))} channels)`;
            }
            else if(/^[579]CHN$/.test(signature)){
                type = `TakeTracker (${parseInt(signature.substr(0,1))} channels)`;
            }
    }

    return type;
};

/*
    Returns the data required to create a new AudioWorkletNode
    This allows the protracker playback code to be executed in its own thread
*/
export function getInitOptions(fileData: ArrayBuffer): AudioWorkletNodeOptions {
    if(!isFileSupported(fileData)) throw new Error;
    const outputCount = getChannelCount(fileData)
    return {
        numberOfOutputs: outputCount,
        outputChannelCount: [...new Array(outputCount)].map(item => 1),
        processorOptions: {
            fileData: fileData
        }
    }
}

/*
    This scans through the pattern sequence table to find the highest pattern index.
    That is the number of patterns used by the module.

    The song may not use all of these though, it may be that some patterns were edited,
    but never intended to be played (imagine devs working to a deadline)
*/
export function getPatternCount(fileData: ArrayBuffer): number {
    const patternSequence = getPatternSequence(fileData);

    // Pattern count is the largest pattern index + 1 (as patterns are zero-indexed)
    return patternSequence.reduce((a,b) => Math.max(a,b)) + 1;
};

/*
    This loads all of the pattern data into the pattern data array.
    The pattern data array is split up into single channel rows.
    So that means we have a 3D array - [pattern][channel][rows].

    I should also mention the structure of how a channels pattern data
    is set out. It is comprised of 32 bits (4 bytes):

    #1           #2                  #3         #4
    0000         0000-00000000       0000       0000-0000000

    #1 = first 4 bits are the UPPER 4 bits of the sample number
    #2 = 12 bits, this is the note period.
    #3 = 4 bits, this is the LOWER 4 bits of the sample number
    #4 = 12 bits, effect command. Can be split into 4bit effect command and 8bit parameter.

    The pattern data is set out as above in 4 byte chunks in the file.
    The row data for each channel is stored in order, so the file is like so:

    [channel0row0-4bytes][channel1row0-4bytes][channel2row0-4bytes][channel3row0-4bytes]
    [channel0row1-4bytes][channel1row1-4bytes][channel2row1-4bytes][channel3row1-4bytes]
    etc...

    If the file has more than 4 channels, it should just follow suit as above (so if there
    are 8 channels, it would be [ch0][ch1][ch2][ch3][ch4][ch5][ch6][ch7] and carry on like
    that for 64 rows). The exception is if the signature FLT8, where instead of having
    8 instructions per row, it has 4 instructions per row and uses two patterns worth of
    rows to create one 8-channel pattern. E.G - the first pattern has [ch0][ch1][ch2][ch3]
    for 64 rows, then the next pattern has [ch4][ch5][ch6][ch7] for 64 rows. You then have
    to stick these back together.
*/
export function getPatterns(fileData: ArrayBuffer): Instruction[][][] {
    const channelCount = getChannelCount(fileData);
    const patterns: Instruction[][][] = [];
    const start = 20 + (30*31) + 1 + 1 + 128 + 4;
    const patternCount = getPatternCount(fileData);
    const view = new DataView(fileData);

    let i, j, k, top, bottom;

    // Loop through patterns
    for(i=0; i<patternCount; i++) {
        patterns[i] = [];

        // Loop through rows in the pattern
        for(j=0; j<64; j++) {
            patterns[i][j] = [];

            // Loop through channels in the row
            for(k=0; k<channelCount; k++) {
                patterns[i][j][k] = {} as Instruction;

                // Sample number
                // We shift right by 4 bits and then left by 4 bits to remove the lower 4 bits.
                top = (view.getUint8(start + (i*64*channelCount*4) + (j*channelCount*4) + (k*4)) >> 4) << 4;
                bottom = view.getUint8(start + (i*64*channelCount*4) + (j*channelCount*4) + (k*4) + 2) >> 4;
                patterns[i][j][k].sampleIndex = top + bottom;

                // period - represented by bottom 4 bits in the first byte and the second byte (12 byte number).
                // We get the lower 4 bits by using the modulus of 16 (remainder of dividing by 16).
                top = (view.getUint8(start + (i*64*channelCount*4) + (j*channelCount*4) + (k*4)) % 16) << 8;
                bottom = view.getUint8(start + (i*64*channelCount*4) + (j*channelCount*4) + (k*4) + 1);
                patterns[i][j][k].period = top + bottom;

                // Effect - get the lower 4 bits of byte 3 by using modulus 16.
                top = view.getUint8(start + (i*64*channelCount*4) + (j*channelCount*4) + (k*4) + 2) % 16;
                bottom =  view.getUint8(start + (i*64*channelCount*4) + (j*channelCount*4) + (k*4) + 3);
                if(top > 0 || bottom > 0) {
                    patterns[i][j][k].effect = {
                        code: top,
                        p:    bottom,
                        px:   (bottom >> 4),
                        py:   (bottom % 16)
                    };
                }
            }
        }
    }

    return patterns;
};

export function getPatternSequence(fileData: ArrayBuffer): number[] {
    const patternSequenceData = fileData.slice(952, 1080);

    let i;
    let lastIndex = 0;
    let patternSequence: number[] = [];

    // Convert pattern sequence bytes to an integer array (they are big endian in the file)
    for(i=0; i<128; i++) {
        patternSequence[i] = utils.read8bitInt(patternSequenceData, i);
    };

    // Find out where the last pattern index is (the sequence is zero-padded)
    for(i=patternSequence.length-1; i>=0; i--) {
        if(patternSequence[i] !== 0) {
            lastIndex = i;
            break;
        }
    }

    // Return pattern sequence, trimming off zero-padding
    return patternSequence.slice(0, lastIndex + 1)
};

export function getRowsPerPattern(fileData: ArrayBuffer): number {
    const signature = getSignature(fileData);

    switch(signature) {
        case 'M!K!':
            return 128;
        default:
            return 64;
    }
};

export function getSampleCount(): number {
    return 31;
};

export function getSamples(fileData: ArrayBuffer, addExtraEndSample: boolean = false): Sample[] {
    const channelCount = getChannelCount(fileData);
    const patternCount = getPatternCount(fileData);
    const samples: Sample[] = [];

    let audio;
    let data;
    let header;
    let headerDataStartOffset = 20;
    let sampleAudioStartOffset = 20 + (30*31) + 1 + 1 + 128 + 4 + (patternCount * 64 * channelCount * 4);
    let sampleHeaderData;
    let i;

    // Run through and extract header and audio data for all samples
    for(i=0; i<31; i++) {
        // Each header is 30 bytes, extract them, then decode. Increment start offset position by 30 for next read.
        sampleHeaderData = fileData.slice(headerDataStartOffset, headerDataStartOffset + 30);
        header = _getSampleHeader(sampleHeaderData);
        headerDataStartOffset = headerDataStartOffset + 30;

        // Extract audio data - the length of the sample comes from the header
        data = fileData.slice(sampleAudioStartOffset, sampleAudioStartOffset + header.length);
        audio = _getSampleAudio(data, addExtraEndSample);
        sampleAudioStartOffset = sampleAudioStartOffset + header.length;

        // Concatenate and add to samples array
        samples[i] = {
            ...header,
            audio
        }
    };

    return samples;
};

export function getSignature(fileData: ArrayBuffer): string {
    const headerStart = 20 + (30*31) + 1 + 1 + 128;
    return utils.readStringFromArrayBuffer(fileData, headerStart, headerStart + 4);
}

export function getSongLoopPatternSequenceIndex(fileData: ArrayBuffer): number | undefined {
    const start = 20 + (30*31) + 1;
    const value = utils.read8bitInt(fileData, start)

    // If value < 127, it signifies loop index. Otherwise, there is no loop (return undefined).
    // return (value < 127) ? value : undefined;

    // Oddly, it seems you should always return 0 for this...?
    return 0;
};

export function getTitle(fileData: ArrayBuffer): string {
    return utils.readStringFromArrayBuffer(fileData, 0, 20).replace(/\u0000/g, ' ').trim();
};

/*
    This figure is the number of pattern sequence positions used by the song
*/
export function getUsedPatternSequenceLength(fileData: ArrayBuffer): number {
    const start = 20 + (30*31);
    return utils.read8bitInt(fileData, start);
}

export function isFileSupported(fileData: ArrayBuffer): boolean {
    return getFormatDescription(fileData) !== constants.UNKNOWN_FORMAT;
}


/*****************************
 *     Private functions     *
 *****************************/

/*
    Value:    0   1   2   3   4   5   6   7   8   9   A   B   C   D   E   F
    Finetune: 0  +1  +2  +3  +4  +5  +6  +7  -8  -7  -6  -5  -4  -3  -2  -1
*/
function _getFineTuneValue(rawInteger: number): number {
    if(rawInteger >= 8)  {
        return -16 + rawInteger
    }
    else {
        return rawInteger;
    }
};

function _getSampleAudio(sampleData: ArrayBuffer, addExtraEndSample: boolean = false): Float32Array {
    const float32Samples = new Float32Array(sampleData.byteLength + (addExtraEndSample ? 1 : 0));
    const view = new DataView(sampleData);

    let i;

    // Run through samples and convert from signed 8-bit int to signed float32
    for(i=0; i<sampleData.byteLength; i++) {
        float32Samples[i] = view.getInt8(i) / 128.00;
    }

    // This is really confusing. Imagine you have a sample 8 bytes long. You can set the loop length to be 8,
    // which you can image as 'a loop length of 8 wave sections'. However, you actually need 9 samples to be
    // able to loop 8 wave sections. So, to sort this, we fudge it by duplicating the last sample. You can check
    // milkytracker on this, it does the same. If you don't do this, very short looping samples will sound noticably
    // higher pitched.
    if(addExtraEndSample) {
        if(addExtraEndSample) {
            float32Samples[i] = float32Samples[i - 1];
        }
    }

    return float32Samples;
};

function _getSampleHeader(sampleHeaderData: ArrayBuffer): SampleHeader {
    return {
        name:         utils.readStringFromArrayBuffer(sampleHeaderData, 0, 22),
        length:       utils.readBigEndian16bitInt(sampleHeaderData, 22) * 2,
        fineTune:     _getFineTuneValue(utils.read8bitInt(sampleHeaderData, 24)),
        volume:       Math.min(utils.read8bitInt(sampleHeaderData, 25), 64),
        repeatOffset: utils.readBigEndian16bitInt(sampleHeaderData, 26) * 2,
        repeatLength: utils.readBigEndian16bitInt(sampleHeaderData, 28) * 2
    }
};


