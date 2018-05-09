import ExtendedClass from '../../ExtendedClass';

export default class ProtrackerChannel extends ExtendedClass {
    constructor(bufferLength, bufferFrequency, amigaClockSpeed) {
        this.amigaClockSpeed = amigaClockSpeed;
        this.buffer = new Array(bufferLength);
        this.bufferFrequency = bufferFrequency;
        this.bufferLength = bufferLength;

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
        };

        this.api = this._getPublicApi();
        return this.api;
    };


    /****************************
     *     Public functions     *
     ****************************/
    fillBuffer(bufferStart, samplesToGenerate) {
        const end = Math.min(bufferStart + samplesToGenerate, this.bufferLength);
        let i = bufferStart;

        // If we have a sample assigned to this channel
        for(i; i < end; i++) {
            // Check that the sample hasn't ended
            if(this.state.sample !== null && !this.state.sampleHasEnded) {
                this.buffer[i] = this._getSampleValue();
                this._incrementSamplePosition();
            }
            else {
                this.buffer[i] = 0;
            }
        }
    };

    getBuffer() {
        return this.buffer;
    };

    getEffect() {
        return this.state.effect;
    };

    getFinetune(finetune) {
        return this.state.finetune;
    };

    getPeriod(period) {
        return this.state.period;
    };

    getSample(sample) {
        return this.state.sample;
    };

    setEffect(effect) {
        this.state.effect = effect;
    };

    setFinetune(finetune) {
        this.state.finetune = finetune;
        this._calculateFrequency();
    };

    setPeriod(period) {
        this.state.period = period;
        this.state.frequency = this._calculateFrequency();
    };

    setSample(sample) {
        this.state.sample = sample;
        this.state.sampleHasEnded = false;
        this.state.sampleHasLooped = false;
        this.state.sampleIncrement = this._calculateSampleIncrement();
        this.state.samplePosition = 0;
    };


    /***************************
     *     Event functions     *
     ***************************/


    /*****************************
     *     Private functions     *
     *****************************/
    _calculateFrequency() {
        return this.amigaClockSpeed / ((this.state.period + this.state.finetune) * 2);
    };

    _calculateSampleIncrement() {
        return this.state.frequency / this.bufferFrequency;
    };

    _getSampleValue() {
        const fractionOfNextSample = this.state.samplePosition % 1;
        const lowerSample = this.state.sample.buffer[Math.floor(this.state.samplePosition)];
        const upperSample = this.state.sample.buffer[Math.ceil(this.state.samplePosition)];

        const diff = this.state.sample.buffer[upper] - this.state.sample.buffer[lower];

        return lower + (fractionOfNextSample * diff);
    };

    _incrementSamplePosition() {
        let nextPosition = this.state.samplePosition + this.state.sampleIncrement;
        let sampleEnd;

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
    };
};