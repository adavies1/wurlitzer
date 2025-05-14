import { QuartetReaderInfo } from "../../readers/QuartetReader/models/QuartetReaderInfo.interface";
import { UNSUPPORTED_FILE } from "../../constants";
import * as utils from '../../readers/QuartetReader/utils';

/**
 * Returns the data required to create a new AudioWorkletNode
 * @param fileDataArr - Array of ArrayBuffer objects that contain raw file data
 */
export function getInitOptions(fileDataArr: ArrayBuffer[]): AudioWorkletNodeOptions {
    if(utils.isFileSupported(fileDataArr)) {
        const { instructionFile, setFile } = utils.getSetAndInstructionFile(fileDataArr);
        const channels = 4;

        const data: QuartetReaderInfo = {
            barMeasurementNote: utils.getBarMeasureMentNote(instructionFile!),
            bitsPerSample: utils.getBitsPerSample(setFile!),
            frequency: utils.getPlaybackFrequency(instructionFile!),
            samples: utils.getSamples(setFile!),
            instructions: utils.getInstructions(instructionFile!),
            tempoMultiplier: utils.getTempoMultiplier(instructionFile!),
            timeSignature: utils.getTimeSignature(instructionFile!),
            title: ''
        }

        console.log('QUARTET:', data);

        return {
            numberOfOutputs: channels,
            outputChannelCount: [...new Array(channels)].map(() => 1),
            processorOptions: {
                fileDataArr,
                data
            }
        }
    } else {
        throw new Error(UNSUPPORTED_FILE);
    }
}