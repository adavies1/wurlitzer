import { ProtrackerReaderInfo } from './models/ProtrackerReaderInfo.interface';
import { UNSUPPORTED_FILE } from '../../constants';
import * as utils from './utils'

export class ProtrackerReader {
    data?: ProtrackerReaderInfo;

    constructor(fileDataArr: ArrayBuffer[]) {
        if(utils.isFileSupported(fileDataArr)) {
            const fileData = fileDataArr[0];
            this.data = {
                channelCount:    utils.getChannelCount(fileData),
                patternCount:    utils.getPatternCount(fileData),
                patterns:        utils.getPatterns(fileData),
                patternSequence: utils.getPatternSequence(fileData),
                rowsPerPattern:  utils.getRowsPerPattern(fileData),
                samples:         utils.getSamples(fileData, true),
                signature:       utils.getSignature(fileData),
                songLength:      utils.getUsedPatternSequenceLength(fileData),
                songLoop:        utils.getSongLoopPatternSequenceIndex(fileData),
                title:           utils.getTitle(fileData),
            };
        } else {
            throw new Error(UNSUPPORTED_FILE)
        }
    }
}
