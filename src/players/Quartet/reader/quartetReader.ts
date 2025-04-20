import { read8bitInt, readBigEndian16bitInt, readBigEndian32bitInt } from "../../../utils"
import { ACTION, INSTRUCTION_SIZE } from "../constants";
import { Instruction } from "../models/Instruction.interface";
import { QuartetInfo } from "../models/QuartetInfo.interface";


export const getPlaybackFrequency = (fileData: ArrayBuffer) => {
    return readBigEndian16bitInt(fileData, 0);
}

export const getBarMeasureMentNote = (fileData: ArrayBuffer) => {
    return readBigEndian16bitInt(fileData, 2);
}

export const getTempoMultiplier = (fileData: ArrayBuffer) => {
    return readBigEndian16bitInt(fileData, 4);
}

export const getTimeSignature = (fileData: ArrayBuffer) => {
    return readBigEndian16bitInt(fileData, 6);
}

export function isFileSupported(fileData: ArrayBuffer): boolean {
    return fileData.byteLength >= 128; // why 128?
}

/*
    Returns the data required to create a new AudioWorkletNode
    This allows the protracker playback code to be executed in its own thread
*/
export function getInitOptions(fileData: ArrayBuffer): AudioWorkletNodeOptions {
    if(!isFileSupported(fileData)) throw new Error;
    const channels = 4;

    const data: QuartetInfo = {
        barMeasurementNote: getBarMeasureMentNote(fileData),
        frequency: getPlaybackFrequency(fileData),
        samples: [],
        instructions: getInstructions(fileData),
        tempoMultiplier: getTempoMultiplier(fileData),
        timeSignature: getTimeSignature(fileData),
        title: ''
    }

    console.log('QUARTET:', data);

    return {
        numberOfOutputs: channels,
        outputChannelCount: [...new Array(channels)].map(item => 1),
        processorOptions: {
            fileData: fileData,
            data
        }
    }
}

export const getInstructions = (fileData: ArrayBuffer) => {
    let instructions: Instruction[][] = [];
    let instructionRow: Instruction[] = [];
    let action: number;
    let params: number[] = [];
    let position = 16;

    // Run through instructions in blocks of four (one instruction per channel)
    while((position + INSTRUCTION_SIZE * 4) < fileData.byteLength) {
        instructionRow = [];

        // For each channel / instruction...
        for(let i = 0; i < 4; i++) {
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
            instructionRow.push({ action, params })
            position = position + INSTRUCTION_SIZE;
        }

        // Record instruction row and then loop
        instructions.push(instructionRow);
    }

    return instructions;
}
