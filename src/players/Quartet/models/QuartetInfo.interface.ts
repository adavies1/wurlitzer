import { PlayerInfo } from "../../Player/models/PlayerInfo.interface";
import { Instruction } from "./Instruction.interface";
import { Sample } from "./Sample.interface";

export interface QuartetInfo extends PlayerInfo {
    barMeasurementNote: number;
    bitsPerSample: number;
    frequency:  number;
    samples: Sample[];
    instructions: Instruction[][];
    tempoMultiplier: number;
    timeSignature: number;
}