import { getChannelCount, isFileSupported } from "../../readers/ProtrackerReader/utils";
import { UNSUPPORTED_FILE } from "../../constants";

/**
 * Returns the data required to create a new AudioWorkletNode
 * @param fileDataArr - Array of ArrayBuffer objects that contain raw file data
 */
export function getInitOptions(fileDataArr: ArrayBuffer[]): AudioWorkletNodeOptions {
    if(isFileSupported(fileDataArr)) {
        const fileData = fileDataArr[0];
        const outputCount = getChannelCount(fileData)
        return {
            numberOfOutputs: outputCount,
            outputChannelCount: [...new Array(outputCount)].map(() => 1),
            processorOptions: {
                fileData: fileData
            }
        }
    } else {
        throw new Error(UNSUPPORTED_FILE);
    }
}