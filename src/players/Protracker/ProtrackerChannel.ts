import { EffectCode } from './models/EffectCode.interface';
import { Sample } from './models/Sample.interface';

export interface state {
    effect: EffectCode,
    finetune: number,
    frequency: number,
    period: number,
    sample: Sample,
    sampleHasEnded: boolean,
    sampleHasLooped: boolean,
    sampleIncrement: number,
    samplePosition: number
}

export class ProtrackerChannel {
    amigaClockSpeed: number;
    buffer: Float32Array;
    bufferFrequency: number;
    bufferLength: number;
    state: state;

    constructor(bufferLength: number, bufferFrequency: number, amigaClockSpeed: number) {
        this.amigaClockSpeed = amigaClockSpeed;
        this.buffer = new Float32Array(bufferLength);
        this.bufferFrequency = bufferFrequency;
        this.bufferLength = bufferLength;
        this.reset();
    };


    /****************************
     *     Public functions     *
     ****************************/
    fillBuffer(bufferStart: number, samplesToGenerate: number): void {
        const end = Math.min(bufferStart + samplesToGenerate, this.bufferLength);
        let i = bufferStart;

        // For every sample we need to generate
        for(i; i < end; i++) {
            // Check that we have a sample assigned and that the sample hasn't ended
            if(this.state.sample !== null && !this.state.sampleHasEnded) {
                this.buffer[i] = this._getSampleValue();
                this._incrementSamplePosition();
            }
            else {
                this.buffer[i] = 0;
            }
        }
    };

    getBuffer(): Float32Array {
        return this.buffer;
    };

    getEffect(): EffectCode {
        return this.state.effect;
    };

    getFinetune(): number {
        return this.state.finetune;
    };

    getPeriod(): number {
        return this.state.period;
    };

    getSample(): Sample {
        return this.state.sample;
    };

    reset(): void {
        this.state = {
            effect: null,
            finetune: 0,
            frequency: 0,
            period: 0,
            sample: null,
            sampleHasEnded: false,
            sampleHasLooped: false,
            sampleIncrement: 0,
            samplePosition: 0
        }
    };

    setEffect(effect: EffectCode): void {
        this.state.effect = effect;
    };

    setFinetune(finetune: number): void {
        this.state.finetune = finetune;
        this._calculateFrequency();
        this._calculateSampleIncrement();
    };

    setPeriod(period: number): void {
        this.state.period = period;
        this._calculateFrequency();
        this._calculateSampleIncrement();
    };

    setSample(sample: Sample): void {
        this.state.sample = sample;
        this.state.sampleHasEnded = false;
        this.state.sampleHasLooped = false;
        this._calculateSampleIncrement();
        this.state.samplePosition = 0;
    };


    /*****************************
     *     Private functions     *
     *****************************/
    _calculateFrequency(): void {
        let finetunedPeriod = this.state.period * (Math.pow(2, (1/12 * this.state.finetune/8)));
        this.state.frequency = this.amigaClockSpeed / (finetunedPeriod * 2);
    };

    _calculateSampleIncrement(): void {
        this.state.sampleIncrement = this.state.frequency / this.bufferFrequency;
    };

    _getSampleValue(): number {
        if(!this.state.sampleHasEnded) {
            const fractionOfNextSample = this.state.samplePosition % 1;
            const lowerSample = this.state.sample.audio[Math.floor(this.state.samplePosition)];
            const upperSample = this.state.sample.audio[Math.ceil(this.state.samplePosition)];
            const diff = upperSample - lowerSample;

            return lowerSample + (fractionOfNextSample * diff);
        }
        else {
            return 0;
        }
    };

    _incrementSamplePosition(): void {
        if(!this.state.sampleHasEnded) {
            let nextPosition = this.state.samplePosition + this.state.sampleIncrement;
            let sampleEnd: number;

            // The end of the sample is different depending on if the sample is now looping or not
            if(this.state.sampleHasLooped) {
                sampleEnd = this.state.sample.repeatOffset + this.state.sample.repeatLength;
            }
            else {
                sampleEnd = this.state.sample.length - 1;
            }

            // Increment sample position
            if(nextPosition < sampleEnd) {
                this.state.samplePosition = nextPosition;
            }
            else {
                if(this.state.sample.repeatLength > 2) {
                    this.state.sampleHasLooped = true;
                    this.state.samplePosition = this.state.sample.repeatOffset + (nextPosition - sampleEnd);
                }
                else {
                    this.state.sampleHasEnded = true;
                }
            }
        }
    };
};