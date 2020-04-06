import { WaveGenerator } from './WaveGenerator.interface';

export interface Oscillator {
    amplitude: number,
    offset: number,
    originalValue: number,
    oscillationsPerRow: number,
    retrigger: boolean,
    waveGenerator: WaveGenerator
}