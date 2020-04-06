import { Vibrato } from './models/Vibrato.interface';
import { WaveGenerator } from './models/WaveGenerator.interface';

export class ProtrackerChannelVibrato implements Vibrato {
    amplitude: number = 1;
    offset: number = 0;
    originalPeriod: number;
    oscillationsPerRow: number = 1;
    retrigger: boolean = false;
    waveGenerator: WaveGenerator = generateSineWave;

    getAmplitude() {
        return this.amplitude;
    }

    getOffset() {
        return this.offset;
    }

    getOriginalPeriod() {
        return this.originalPeriod;
    }

    getOscillationsPerRow() {
        return this.oscillationsPerRow;
    }

    getRetrigger() {
        return this.retrigger;
    }

    getValue(rowPosition: number): number {
        return this.waveGenerator(rowPosition, this.offset, this.oscillationsPerRow, this.amplitude);
    }

    getWaveGenerator() {
        return this.waveGenerator;
    }

    setAmplitude(amplitude: number) {
        if(amplitude > 0) {
            this.amplitude = amplitude;
        }
    }

    setOffset(offset: number) {
        this.offset = offset;
    }

    setOriginalPeriod(period: number) {
        this.originalPeriod = period;
    }

    setOscillationsPerRow(oscillationsPerRow: number) {
        if(oscillationsPerRow > 0) {
            this.oscillationsPerRow = oscillationsPerRow;
        }
    }

    setRetrigger(retrigger: boolean) {
        this.retrigger = retrigger;
    }

    setWaveGenerator(waveGenerator: WaveGenerator) {
        this.waveGenerator = waveGenerator; // FIXME
    }
}

export const generateSineWave : WaveGenerator = (rowPosition, offset = 0, oscillationsPerRow = 1, amplitude = 1) => {
    return Math.sin(((rowPosition * oscillationsPerRow) + offset) * 2 * Math.PI ) * amplitude;
}