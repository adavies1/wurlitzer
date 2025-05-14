import { EffectCode } from './EffectCode.interface';

export interface Instruction {
    effect: EffectCode | undefined;
    period: number;
    sampleIndex: number;
}
