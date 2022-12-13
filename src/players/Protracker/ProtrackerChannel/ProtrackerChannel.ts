import { effectFactory } from '../effects/effectFactory';
import { EffectCode } from '../models/EffectCode.interface';
import { Instruction } from '../models/Instruction.interface';
import { Sample } from '../models/Sample.interface';
import ProtrackerOscillator from '../ProtrackerOscillator';
import { applyVolumeToSample, getFineTunedPeriod, getFrequency, getNextSampleIncrement, getSampleIncrementValue, getSampleValue } from './utils';

export type state = {
    effect: ReturnType<typeof effectFactory>,
    fineTune: number,
    frequency: number,
    instruction: Instruction | undefined,
    originalPeriod: number,
    fineTunedPeriod: number,
    period: number,
    sample: Sample | undefined,
    sampleHasEnded: boolean,
    sampleIncrement: number,
    samplePosition: number,
    slideRate: number,
    slideTarget: number,
    tremolo: ProtrackerOscillator,
    vibrato: ProtrackerOscillator,
    volume: number
}

const getDefaultState = ():state => {
    return {
        effect: undefined,
        fineTune: 0,
        frequency: 0,
        instruction: undefined,
        originalPeriod: 0,
        fineTunedPeriod: 0,
        period: 0,
        sample: undefined,
        sampleHasEnded: false,
        sampleIncrement: 0,
        samplePosition: 0,
        slideRate: 0,
        slideTarget: 0,
        tremolo: new ProtrackerOscillator,
        vibrato: new ProtrackerOscillator,
        volume: 64
    };
};


export default class ProtrackerChannel {
    amigaClockSpeed: number;
    bufferFrequency: number;
    id: number;
    state: state = getDefaultState();

    constructor(id: number, bufferFrequency: number, amigaClockSpeed: number) {
        this.id = id;
        this.amigaClockSpeed = amigaClockSpeed;
        this.bufferFrequency = bufferFrequency;
        this.reset();
    };


    // ****************************
    // *     Public functions     *
    // ****************************

    fillBuffer(buffer: Float32Array, bufferStart: number, samplesToGenerate: number): void {
        const end = Math.min(bufferStart + samplesToGenerate, buffer.length);
        let i = bufferStart;

        // For every sample we need to generate
        for(i; i < end; i++) {
            // Check that we have a sample assigned and that the sample hasn't ended
            if(this.state.sample !== null && !this.state.sampleHasEnded) {
                buffer[i] = this._getSampleValue();
                this._incrementSamplePosition();
            }
            else {
                buffer[i] = 0;
            }
        }
    };

    getEffect() {
        return this.state.effect;
    };

    getEffectCode(): EffectCode | undefined {
        return this.state.instruction ? this.state.instruction.effect : undefined;
    };

    getFineTune(): number {
        return this.state.fineTune;
    };

    getId() {
        return this.id;
    }

    getInstruction(): Instruction | undefined {
        return this.state.instruction;
    }

    getOriginalPeriod(): number {
        return this.state.originalPeriod;
    }

    getFineTunedPeriod(): number {
        return this.state.fineTunedPeriod;
    }

    getPeriod(): number {
        return this.state.period;
    };

    getSample(): Sample | undefined {
        return this.state.sample;
    };

    getSamplePosition(): number {
        return this.state.samplePosition;
    }

    getSlideRate(): number {
        return this.state.slideRate;
    }

    getSlideTarget(): number {
        return this.state.slideTarget;
    }

    getTremolo(): ProtrackerOscillator {
        return this.state.tremolo;
    }

    getVibrato(): ProtrackerOscillator {
        return this.state.vibrato;
    }

    getVolume(): number {
        return this.state.volume;
    }

    reset(): void {
        this.state = getDefaultState();
    };

    resetFineTune() {
        this.state.fineTune = this.state.sample ? this.state.sample.fineTune : 0;
    }

    resetPeriod() {
        this.setPeriod(this.state.fineTunedPeriod);
    }

    resetSample() {
        this.state.sampleHasEnded = false;
        this.state.samplePosition = 0;
        this._calculateSampleIncrement();
    }

    resetVolume() {
        this.state.volume = this.state.sample ? this.state.sample.volume : 64;
    }

    setFineTune(fineTune: number): void {
        this.state.fineTune = fineTune;
        this._calculateFineTunedPeriod();
        this.setPeriod(this.state.fineTunedPeriod);
        this._calculateFrequency();
        this._calculateSampleIncrement();
    };

    setInstruction(instruction: Instruction): void {
        this.state.instruction = instruction;
        this.state.effect = effectFactory(instruction.effect);
    }

    setOriginalPeriod(period: number): void {
        this.state.originalPeriod = period;
        this._calculateFineTunedPeriod();
        this.setPeriod(this.state.fineTunedPeriod);
    }

    setPeriod(period: number): void {
        this.state.period = period;
        this._calculateFrequency();
        this._calculateSampleIncrement();
    };

    setSample(sample: Sample): void {
        this.state.sample = sample;
    };

    setSampleAsEnded(): void {
        this.state.sampleHasEnded = true;
    }

    setSamplePosition(position: number): void {
        this.state.samplePosition = position;
    }

    setSlideRate(rate: number): void {
        this.state.slideRate = rate;
    }

    setSlideTarget(target: number): void {
        this.state.slideTarget = target;
    }

    setVolume(volume: number): void {
        this.state.volume = volume;
    }


    // *****************************
    // *     Private functions     *
    // *****************************

    private _calculateFrequency(): void {
        this.state.frequency = getFrequency(this.amigaClockSpeed, this.state.period);
    };

    private _calculateFineTunedPeriod() {
        this.state.fineTunedPeriod = getFineTunedPeriod(this.state.originalPeriod, this.state.fineTune);
    }

    private _calculateSampleIncrement(): void {
        this.state.sampleIncrement = getSampleIncrementValue(this.state.frequency, this.bufferFrequency);
    };

    private _getSampleValue(): number {
        if(this.state.sample && !this.state.sampleHasEnded) {
            const sample = getSampleValue(this.state.sample.audio, this.state.samplePosition);
            return applyVolumeToSample(sample, this.state.volume);
        }
        return 0;
    };

    private _incrementSamplePosition(): void {
        if(this.state.sample && !this.state.sampleHasEnded) {
            const { sample, samplePosition, sampleIncrement } = this.state;
            const { nextPosition, sampleHasEnded } = getNextSampleIncrement(sample, samplePosition, sampleIncrement);

            this.state.samplePosition = nextPosition;
            this.state.sampleHasEnded = sampleHasEnded;
        }
    };
};