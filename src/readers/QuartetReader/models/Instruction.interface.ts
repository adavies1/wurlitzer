import { ACTION } from "../constants";

export interface Instruction {
    action: ACTION;
    params: number[];
    nextInstruction?: Instruction;
}