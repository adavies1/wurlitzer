import { read8bitInt, readBigEndian16bitInt, readBigEndian24bitInt, readBigEndian32bitInt, readHexWord, readStringFromArrayBuffer } from "../../../utils"
import { ACTION, INSTRUCTION_SIZE } from "../constants";
import { Instruction } from "../models/Instruction.interface";
import { QuartetInfo } from "../models/QuartetInfo.interface";
import { Sample } from "../models/Sample.interface";


export const getPlaybackFrequency = (instructionFile: ArrayBuffer) => {
    return readBigEndian16bitInt(instructionFile, 0);
}

export const getBarMeasureMentNote = (instructionFile: ArrayBuffer) => {
    return readBigEndian16bitInt(instructionFile, 2);
}

export const getBitsPerSample = (setFile: ArrayBuffer) => {
    return read8bitInt(setFile, 0);
}

export const getSample = (setFile: ArrayBuffer, startOffset: number) => {
    const sampleData = setFile.slice(startOffset);
    const view = new DataView(sampleData);

    const sample: Sample = {
        signature: readStringFromArrayBuffer(sampleData, 0, 4),
        name: readStringFromArrayBuffer(sampleData, 4, 12),
        isStereo: !!readBigEndian16bitInt(sampleData, 12),
        bitsPerSample: readBigEndian16bitInt(sampleData, 14),
        isSigned: !!readBigEndian16bitInt(sampleData, 16),
        isLooping: !!readBigEndian16bitInt(sampleData, 18),
        midiNote: readHexWord(sampleData, 20),
        frequency: readBigEndian24bitInt(sampleData, 23),
        sampleCount: readBigEndian32bitInt(sampleData, 26),
        loopStart: readBigEndian32bitInt(sampleData, 30),
        loopEnd: readBigEndian32bitInt(sampleData, 34),
        nameExtension: readStringFromArrayBuffer(sampleData, 44, 64),
        headerExtra: readStringFromArrayBuffer(sampleData, 64, 128),
        quartetCustom: {
            sampleCount: readBigEndian24bitInt(sampleData, 124)
        },
        samples: new Float32Array(readBigEndian24bitInt(sampleData, 124))
    }

    // Run through samples
    for(let i=0; i<sample.sampleCount; i++) {
        let rawSample = 0;
        const sampleMax = Math.pow(2, sample.bitsPerSample - 1);

        // Read raw 8bit / 16bit sample
        if(sample.bitsPerSample === 8) {
            rawSample = sample.isSigned ? view.getInt8(i) : view.getUint8(i);
        } else {
            rawSample = sample.isSigned ? view.getInt16(i, false) : view.getUint16(i, false);
        }

        // Convert sample to signed, then convert to signed float32
        const signedSample = sample.isSigned ? rawSample : (rawSample - sampleMax);
        sample.samples[i] = signedSample / sampleMax;
    }

    return sample;
}

/**
 * @param setFile - SET file to read the samples from
 */
export const getSamples = (setFile: ArrayBuffer) => {
    const activeSamples = read8bitInt(setFile, 1) - 1;
    const names: string[] = [];
    const offsets: number[] = [];
    const samples: Sample[] = [];

    let start = 0;
    let end = 0;

    // Read names
    for(let i=0; i<20; i++) {
        start = 2 + (i * 7);
        end = start + 7;
        names[i] = readStringFromArrayBuffer(setFile, start, end);
    }

    // Read offsets
    for(let i=0; i<20; i++) {
        start = 142 + (i * 4);
        offsets[i] = readBigEndian32bitInt(setFile, start);
    }

    // Read AVR samples
    for(let i=0; i<activeSamples; i++) {
        // Offsets are strange as they point to the last 8 bytes of the AVR header. It seems that
        // Quartet uses those last 8 bytes of the header to store its own data about the sample, and
        // then the same data starts 8 bytes later, as expected.
        samples[i] = getSample(setFile, offsets[i] - 120);
        samples[i].name = names[i]; // Fix name using one from instruction file
    }

    return samples;
}

export const getSetAndInstructionFile = (fileDataArr: ArrayBuffer[]) => {
    const setFile = fileDataArr.find(file => file.byteLength >= 226 && readStringFromArrayBuffer(file, 222, 226) === '2BIT')
    const instructionFile = fileDataArr.find(file => file !== setFile);
    return { setFile, instructionFile };
}

export const getTempoMultiplier = (instructionFile: ArrayBuffer) => {
    return readBigEndian16bitInt(instructionFile, 4);
}

export const getTimeSignature = (instructionFile: ArrayBuffer) => {
    return readBigEndian16bitInt(instructionFile, 6);
}

export const isInstructionFileValid = (instructionFile: ArrayBuffer) => {
    const instructions = (instructionFile.byteLength - 16) / INSTRUCTION_SIZE;

    return (
        instructionFile.byteLength >= 128
        && readBigEndian16bitInt(instructionFile, 8) === 0 // check bytes 8-15 is 0x00000000
        && readBigEndian16bitInt(instructionFile, 10) === 0
        && readBigEndian16bitInt(instructionFile, 12) === 0
        && readBigEndian16bitInt(instructionFile, 14) === 0
        && instructions % 1 === 0  // check that bytes divide perfectly by 12 (there should not be any leftover bytes)
    )
}

export const isSetFileValid = (setFile: ArrayBuffer) => {
    return (
        readStringFromArrayBuffer(setFile, 222, 226) === '2BIT'
    );
}

export function isFileSupported(fileDataArr: ArrayBuffer[]): boolean {
    if(fileDataArr.length === 2) {
        const { setFile, instructionFile} = getSetAndInstructionFile(fileDataArr);

        if(setFile && instructionFile) {
            return isInstructionFileValid(instructionFile) && isSetFileValid(setFile);
        }
    }

    return false;
}

/*
    Returns the data required to create a new AudioWorkletNode
    This allows the protracker playback code to be executed in its own thread
*/
export function getInitOptions(fileDataArr: ArrayBuffer[]): AudioWorkletNodeOptions {
    if(!isFileSupported(fileDataArr)) throw new Error;

    const { instructionFile, setFile } = getSetAndInstructionFile(fileDataArr);
    const channels = 4;

    const data: QuartetInfo = {
        barMeasurementNote: getBarMeasureMentNote(instructionFile!),
        bitsPerSample: getBitsPerSample(setFile!),
        frequency: getPlaybackFrequency(instructionFile!),
        samples: getSamples(setFile!),
        instructions: getInstructions(instructionFile!),
        tempoMultiplier: getTempoMultiplier(instructionFile!),
        timeSignature: getTimeSignature(instructionFile!),
        title: ''
    }

    console.log('QUARTET:', data);

    return {
        numberOfOutputs: channels,
        outputChannelCount: [...new Array(channels)].map(item => 1),
        processorOptions: {
            fileDataArr,
            data
        }
    }
}

export const getInstructions = (fileData: ArrayBuffer) => {
    let instructions: Instruction[][] = [[], [], [], []];
    let action: number;
    let params: number[] = [];
    let position = 16;
    let channel = 0;

    // Run through instructions
    while((position + INSTRUCTION_SIZE) <= fileData.byteLength) {
        channel = channel === 3 ? 0 : channel + 1;
        action = read8bitInt(fileData, position + 1);
        params = [];

        switch(action) {
            case ACTION.PLAY:
            case ACTION.REST: {
                params.push(readBigEndian16bitInt(fileData, position + 2)); // length
                params.push(readBigEndian32bitInt(fileData, position + 4)); // frequency
                break;
            }
            case ACTION.NOTESLIDE: {
                params.push(readBigEndian16bitInt(fileData, position + 2)); // length
                params.push(readBigEndian32bitInt(fileData, position + 4)); // frequency
                params.push(readBigEndian32bitInt(fileData, position + 8)); // step size
                break;
            }
            case ACTION.VOICECHANGE: {
                params.push(readBigEndian16bitInt(fileData, position + 10)); // table offset
                break;
            }
            case ACTION.ENDLOOP: {
                params.push(readBigEndian16bitInt(fileData, position + 8)); // times
                break;
            }
        }

        // Record instruction and move to next instruction position
        instructions[channel].push({ action, params })
        position = position + INSTRUCTION_SIZE;
    }

    return instructions;
}
