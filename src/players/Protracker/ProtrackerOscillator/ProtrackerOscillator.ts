import { Oscillator } from '../models/Oscillator.interface';
import { WaveGenerator } from '../models/WaveGenerator.interface';
import { WaveType } from '../models/WaveType.interface';
import { pickRandom } from '../../../utils';
import * as utils from './utils';

export default class ProtrackerOscillator implements Oscillator {
    amplitude: number = 1;
    offset: number = 0;
    originalValue: number = 0;
    oscillationsPerRow: number = 1;
    retrigger: boolean = false;
    waveGenerator: WaveGenerator = utils.generateSineWave;

    getAmplitude() {
        return this.amplitude;
    }

    getOffset() {
        return this.offset;
    }

    getOriginalValue() {
        return this.originalValue;
    }

    getOscillationsPerRow() {
        return this.oscillationsPerRow;
    }

    getRetrigger() {
        return this.retrigger;
    }

    getValue(rowPosition: number): number {
        return this.originalValue + this.waveGenerator(rowPosition, this.offset, this.oscillationsPerRow, this.amplitude);
    }

    getWaveGenerator() {
        return this.waveGenerator;
    }

    incrementOffset() {
        this.offset = (this.offset + this.oscillationsPerRow) % 1;
    }

    setAmplitude(amplitude: number) {
        if(amplitude > 0) {
            this.amplitude = amplitude;
        }
    }

    setOffset(offset: number) {
        this.offset = offset;
    }

    setOriginalValue(period: number) {
        this.originalValue = period;
    }

    setOscillationsPerRow(oscillationsPerRow: number) {
        if(oscillationsPerRow > 0) {
            this.oscillationsPerRow = oscillationsPerRow;
        }
    }

    setRetrigger(retrigger: boolean) {
        this.retrigger = retrigger;
    }

    setWaveGenerator(type: WaveType) {
        switch(type) {
            case 'random':
                this.setWaveGenerator(pickRandom('sawtooth', 'sine', 'square'));
                break;
            case 'sawtooth':
                this.waveGenerator = utils.generateSawtoothWave;
                break;
            case 'sine':
                this.waveGenerator = utils.generateSineWave;
                break;
            case 'square':
                this.waveGenerator = utils.generateSquareWave;
                break;
        }
    }
}
