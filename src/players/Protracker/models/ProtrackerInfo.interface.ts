import { PlayerInfo } from "../../Player/models/PlayerInfo.interface";
import { Instruction } from "./Instruction.interface";
import { Sample } from "./Sample.interface";

export interface ProtrackerInfo extends PlayerInfo {
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