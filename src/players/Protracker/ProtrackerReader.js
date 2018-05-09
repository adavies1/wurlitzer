import * as utils from '../../utils'


/****************************
 *     Public functions     *
 ****************************/
export function getChannelCount(fileData) {
    const signature = getSignature(fileData);
    let channelCount = 4;

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
        case /^[0-9][0-9]CH$/.test(signature):
            channelCount = parseInt(signature.substr(0,2));
            break;
        case /^TDZ[0-9]$/.test(signature):
            channelCount = parseInt(signature.substr(3));
            break;
        case /^[579]CHN$/.test(signature):
            channelCount = parseInt(signature.substr(0,1));
            break;
    }

    return channelCount;
};

export function getFormatDescription(fileData) {
    const signature = getSignature(fileData);
    let type = 'unknown';

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
        case /^[0-9][0-9]CH$/.test(signature):
            type = `FastTracker (${parseInt(signature.substr(0,2))} channels)`;
            break;
        case 'CD81':
        case 'OKTA':
            type = 'Oktalyzer';
            break;
        case 'OCTA':
            type = 'Octamed';
            break;
        case /^TDZ[0-9]$/.test(signature):
            type = `TakeTracker (${parseInt(signature.substr(3))} channels)`;
            break;
        case /^[579]CHN$/.test(signature):
            type = `TakeTracker (${parseInt(signature.substr(0,1))} channels)`;
            break;
        case 'FLT4':
            type = 'StarTrekker';
            break;
        case 'FLT8':
            type = 'StarTrekker (8 channels)';
            break;
    }

    return type;
};

/*
    This scans through the pattern sequence table to find the highest pattern index.
    That is the number of patterns used by the song.
*/
export function getPatternCount(fileData) {
    const patternSequence = getPatternSequence(fileData);

    // Pattern count is the largest pattern index + 1 (as patterns are zero-indexed)
    return patternSequence.reduce((a,b) => {
        return Math.max(a,b)
    }) + 1;
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
export function getPatterns(fileData) {
    const channelCount = getChannelCount(fileData);
    const patterns = [];
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
                patterns[i][j][k] = {};

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
                patterns[i][j][k].effect = {
                    code: top,
                    p:    bottom,
                    px:   (bottom >> 4),
                    py:   (bottom % 16)
                };
            }
        }
    }

    return patterns;
};

export function getPatternSequence(fileData) {
    const patternSequenceData = fileData.slice(952, 1080);

    let i;
    let lastIndex = 0;
    let patternSequence = [];

    // Convert pattern sequence bytes to an integer array (they are big endian in the file)
    for(i=0; i<128; i++) {
        patternSequence[i] = utils.readBigEndian8bitInt(patternSequenceData, i);
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

export function getSampleCount() {
    return 31;
};

export function getSamples(fileData) {
    const channelCount = getChannelCount(fileData);
    const patternCount = getPatternCount(fileData);
    const samples = [];

    let start;
    let sampleHeaderData;
    let i;

    // Run through file extracting sample data from sample headers
    start = 20;
    for(i=0; i<31; i++) {
        // Each header is 30 bytes, extract them
        sampleHeaderData = fileData.slice(start, start + ((i+1) * 30));

        // Decode the header for this sample (returns object) and add to array
        samples.push(_getSampleHeader(sampleHeaderData));
    }

    // Run through samples and read sample wave data from file
    start = 20 + (30*31) + 1 + 1 + 128 + 4 + (patternCount * 64 * channelCount * 4);
    for(i=0; i<31; i++) {
        // Convert audio data for this sample to float32 array
        samples[i].audio = _getSampleAudio(fileData.slice(start, start + samples[i].length));

        // Record the start of the next sample (samples are stored together, one after the next)
        start = start + samples[i].length;
    }

    return samples;
};

export function getSignature(fileData) {
    const headerStart = 20 + (30*31) + 1 + 1 + 128;
    return utils.readStringFromArrayBuffer(fileData, headerStart, headerStart + 4);
}

export function getSongLoopPatternSequenceIndex(fileData) {
    const start = 20 + (30*31) + 1;
    const value = utils.readBigEndian8bitInt(fileData, start)

    // If value < 127, it signifies loop index. Otherwise, there is no loop (return undefined).
    if(value < 127) {
        return value;
    }
};

export function getTitle(fileData) {
    return utils.readStringFromArrayBuffer(fileData, 0, 20).replace(/\u0000/g, ' ').trim();
};

/*
    This figure is the number of pattern sequence positions used by the song
*/
export function getUsedPatternSequenceLength(fileData) {
    const start = 20 + (30*31);
    return utils.readBigEndian8bitInt(fileData, start);
}



/*****************************
 *     Private functions     *
 *****************************/

/*
    Value:    0   1   2   3   4   5   6   7   8   9   A   B   C   D   E   F
    Finetune: 0  +1  +2  +3  +4  +5  +6  +7  -8  -7  -6  -5  -4  -3  -2  -1
*/
function _getFineTuneValue(rawInteger) {
    if(rawInteger >= 8)  {
        return -16 + rawInteger
    }
    else {
        return rawInteger;
    }
};

function _getSampleAudio(sampleData) {
    const view = new DataView(sampleData);

    // Create a float32 array to hold our converted samples
    let float32Samples = new Float32Array(sampleData.byteLength);
    let i;

    // Run through samples and convery from signed 8-bit int to signed float32
    for(i=0; i<sampleData.byteLength; i++) {
        float32Samples[i] = view.getInt8(i) / 128.00;
    }

    return float32Samples;
};

function _getSampleHeader(sampleHeaderData) {
    return {
        name:         utils.readStringFromArrayBuffer(sampleHeaderData, 0, 22),
        length:       utils.readBigEndian16bitInt(sampleHeaderData, 22) * 2,
        fineTune:     _getFineTuneValue(utils.readBigEndian8bitInt(sampleHeaderData, 24)),
        volume:       Math.min(utils.readBigEndian8bitInt(sampleHeaderData, 25), 64),
        repeatOffset: utils.readBigEndian16bitInt(sampleHeaderData, 26) * 2,
        repeatLength: utils.readBigEndian16bitInt(sampleHeaderData, 28) * 2
    }
};


