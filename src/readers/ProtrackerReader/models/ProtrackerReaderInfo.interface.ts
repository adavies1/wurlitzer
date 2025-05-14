import { Instruction } from "./Instruction.interface";
import { ReaderInfo } from "../../ReaderInfo.interface";
import { Sample } from "./Sample.interface";

export interface ProtrackerReaderInfo extends ReaderInfo {
    channelCount:    number;
    patternCount:    number;
    patterns:        Instruction[][][];
    patternSequence: number[];
    rowsPerPattern:  number,
    samples:         Sample[];
    signature:       string;
    songLength:      number;
    songLoop:        number | undefined;
};