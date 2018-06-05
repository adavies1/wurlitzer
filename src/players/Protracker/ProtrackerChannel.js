import ExtendedClass from '../../ExtendedClass';

export default class ProtrackerChannel extends ExtendedClass {
    constructor(bufferLength, bufferFrequency, amigaClockSpeed) {
        super();

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
        this.state.frequency = this._calculateFrequency();
        this.state.sampleIncrement = this._calculateSampleIncrement();
    };

    setPeriod(period) {
        this.state.period = period;
        this.state.frequency = this._calculateFrequency();
        this.state.sampleIncrement = this._calculateSampleIncrement();
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
        let finetunedPeriod = this.state.period * (Math.pow(2, (1/12 * this.state.finetune/8)));
        return this.amigaClockSpeed / (finetunedPeriod * 2);
    };

    _calculateSampleIncrement() {
        return this.state.frequency / this.bufferFrequency;
    };

    _getSampleValue() {
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

    _incrementSamplePosition() {
        if(!this.state.sampleHasEnded) {
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
        }
    };
};