import { ProtrackerReaderInfo } from './models/ProtrackerReaderInfo.interface';
import * as utils from './utils'

export class ProtrackerReader {
    data?: ProtrackerReaderInfo;

    constructor(fileData: ArrayBuffer) {
        if(utils.isFileSupported(fileData)) {
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
            throw new Error('File not supported')
        }
    }
}
