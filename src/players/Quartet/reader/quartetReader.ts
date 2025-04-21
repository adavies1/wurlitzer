import { read8bitInt, readBigEndian16bitInt, readBigEndian32bitInt, readStringFromArrayBuffer } from "../../../utils"
import { ACTION, INSTRUCTION_SIZE } from "../constants";
import { Instruction } from "../models/Instruction.interface";
import { QuartetInfo } from "../models/QuartetInfo.interface";


export const getPlaybackFrequency = (fileData: ArrayBuffer) => {
    return readBigEndian16bitInt(fileData, 0);
}

export const getBarMeasureMentNote = (fileData: ArrayBuffer) => {
    return readBigEndian16bitInt(fileData, 2);
}

export const getSetAndInstructionFile = (fileDataArr: ArrayBuffer[]) => {
    const setFile = fileDataArr.find(file => file.byteLength >= 226 && readStringFromArrayBuffer(file, 222, 226) === '2BIT')
    const instructionFile = fileDataArr.find(file => file !== setFile);
    return { setFile, instructionFile };
}

export const getTempoMultiplier = (fileData: ArrayBuffer) => {
    return readBigEndian16bitInt(fileData, 4);
}

export const getTimeSignature = (fileData: ArrayBuffer) => {
    return readBigEndian16bitInt(fileData, 6);
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
        frequency: getPlaybackFrequency(instructionFile!),
        samples: [],
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
