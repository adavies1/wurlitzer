import { Instruction } from "./Instruction.interface";
import { ReaderInfo } from "../../ReaderInfo.interface";
import { Sample } from "./Sample.interface";

export interface QuartetReaderInfo extends ReaderInfo {
    barMeasurementNote: number;
    bitsPerSample: number;
    frequency:  number;
    samples: Sample[];
    instructions: Instruction[][];
    tempoMultiplier: number;
    timeSignature: number;
}