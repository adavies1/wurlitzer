import { EffectCode } from './EffectCode.interface';

export interface Instruction {
    effect: EffectCode;
    period: number;
    sampleIndex: number;
}
