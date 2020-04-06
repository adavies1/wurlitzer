export interface WaveGenerator {
    (rowPosition: number, offset?: number, oscillationsPerRow?: number, amplitude?: number): number;
}