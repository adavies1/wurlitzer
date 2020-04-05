export interface VibratoParams {
    amplitude: number,
    offset: number,
    originalPeriod: number,
    oscillationsPerRow: number,
    retrigger: boolean,
    waveGenerator: Function
}