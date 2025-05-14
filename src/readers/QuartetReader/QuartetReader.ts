import { QuartetReaderInfo } from './models/QuartetReaderInfo.interface';
import { UNSUPPORTED_FILE } from '../../constants';
import * as utils from './utils'

export class QuartetReader {
    data?: QuartetReaderInfo;

    constructor(fileDataArr: ArrayBuffer[]) {
        if(utils.isFileSupported(fileDataArr)) {
            const { setFile, instructionFile} = utils.getSetAndInstructionFile(fileDataArr);
            if(instructionFile && setFile) {
                this.data = {
                    barMeasurementNote: utils.getBarMeasureMentNote(instructionFile),
                    bitsPerSample: utils.getBitsPerSample(setFile),
                    frequency: utils.getPlaybackFrequency(instructionFile),
                    samples: utils.getSamples(setFile),
                    instructions: utils.getInstructions(instructionFile),
                    tempoMultiplier: utils.getTempoMultiplier(instructionFile),
                    timeSignature: utils.getTimeSignature(instructionFile),
                    title: ''
                };
            }
        } else {
            throw new Error(UNSUPPORTED_FILE)
        }
    }
}
