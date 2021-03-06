import { EffectCode } from './models/EffectCode.interface';
import { Instruction } from './models/Instruction.interface';
import { Sample } from './models/Sample.interface';
import ProtrackerOscillator from './ProtrackerOscillator';

export type state = {
    effect: EffectCode | undefined,
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
    state: state = getDefaultState();

    constructor(bufferFrequency: number, amigaClockSpeed: number) {
        this.amigaClockSpeed = amigaClockSpeed;
        this.bufferFrequency = bufferFrequency;
        this.reset();
    };


    /****************************
     *     Public functions     *
     ****************************/

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

    getEffect(): EffectCode | undefined {
        return this.state.instruction ? this.state.instruction.effect : undefined;
    };

    getFineTune(): number {
        return this.state.fineTune;
    };

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


    /*****************************
     *     Private functions     *
     *****************************/

    _calculateFrequency(): void {
        this.state.frequency = this.amigaClockSpeed / (this.state.period * 2);
    };

    _calculateFineTunedPeriod() {
        const fineTune = this.state.fineTune || 0;
        let period = this.state.originalPeriod;

        if(fineTune !== 0) {
            if (fineTune > 0) {
                period = period / Math.pow(2, Math.abs(fineTune) / (8 * 12))
            }
            else {
                period = period * Math.pow(2, Math.abs(fineTune) / (8 * 12))
            }
        }

        this.state.fineTunedPeriod = period;
    }

    _calculateSampleIncrement(): void {
        this.state.sampleIncrement = this.state.frequency / this.bufferFrequency;
    };

    _getSampleValue(): number {
        if(this.state.sample && !this.state.sampleHasEnded) {
            const fractionOfNextSample = this.state.samplePosition % 1;
            const lowerSample = this.state.sample.audio[Math.floor(this.state.samplePosition)];
            const upperSample = this.state.sample.audio[Math.ceil(this.state.samplePosition)];
            const diff = upperSample - lowerSample;

            return (lowerSample + (fractionOfNextSample * diff)) * (this.state.volume / 64);
        }
        else {
            return 0;
        }
    };

    _incrementSamplePosition(): void {
        if(this.state.sample && !this.state.sampleHasEnded) {
            let nextPosition = this.state.samplePosition + this.state.sampleIncrement;
            let sampleEnd: number;

            // The end of the sample is different depending on if the sample is now looping or not
            if(this.state.sample.repeatLength > 2) {
                sampleEnd = this.state.sample.repeatOffset + this.state.sample.repeatLength;
            }
            else {
                sampleEnd = this.state.sample.length;
            }

            // Increment sample position
            if(nextPosition < sampleEnd) {
                this.state.samplePosition = nextPosition;
            }
            else {
                if(this.state.sample.repeatLength > 2) {
                    this.state.samplePosition = this.state.sample.repeatOffset + (nextPosition - sampleEnd);
                }
                else {
                    this.state.sampleHasEnded = true;
                }
            }
        }
    };
};
