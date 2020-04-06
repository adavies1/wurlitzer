import { WaveGenerator } from './WaveGenerator.interface';

export interface Vibrato {
    amplitude: number,
    offset: number,
    originalPeriod: number,
    oscillationsPerRow: number,
    retrigger: boolean,
    waveGenerator: WaveGenerator
}