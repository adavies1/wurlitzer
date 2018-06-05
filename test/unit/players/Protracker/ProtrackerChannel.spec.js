import {use, expect} from 'chai';
import ProtrackerChannel from '../../../../src/players/Protracker/ProtrackerChannel';

describe('ProtrackerChannel tests', () => {
    const sample = {
        audio:        new Float32Array(128),
        name:         'test',
        length:       128,
        fineTune:     0,
        volume:       64,
        repeatOffset: 0,
        repeatLength: 0
    };
    let channel;

    before(() => {
        // Add some audio data to sample
        for(let i=0; i<64; i++) {
            sample.audio[i] = Math.sin((i+1) / 64);
            sample.audio[i+64] = Math.sin((i+1) / -64);
        }
    });

    beforeEach(() => {
        channel = new ProtrackerChannel(4096, 44100, 7093789.2);
    });

    it('Should return a public API with specific functions', () => {
        expect(Object.keys(channel)).to.eql([
            'fillBuffer',
            'getBuffer',
            'getEffect',
            'getFinetune',
            'getPeriod',
            'getSample',
            'setEffect',
            'setFinetune',
            'setPeriod',
            'setSample'
        ]);
    });

    describe('fillBuffer tests', () => {
        it('Should generate 64 samples for note C-1', () => {
            checkGeneratedFinetunedSamples(0);
        });

        it('Should generate 64 positively finetuned samples', () => {
            checkGeneratedFinetunedSamples(7);
        });

        it('Should generate 64 negatively finetuned samples', () => {
            checkGeneratedFinetunedSamples(-4);
        });
    });

    describe('getBuffer tests', () => {
        it('Should return a buffer of length 4096', () => {
            let buffer = channel.getBuffer();
            expect(buffer.length).to.equal(4096);
        });
    });

    describe('getEffect tests', () => {
        it('Should return null (default value)', () => {
            expect(channel.getEffect()).to.equal(null);
        });
    });

    describe('getFinetune tests', () => {
        it('Should return 0 (default value)', () => {
            expect(channel.getFinetune()).to.equal(0);
        });
    });

    describe('getPeriod tests', () => {
        it('Should return 0 (default value)', () => {
            expect(channel.getPeriod()).to.equal(0);
        });
    });

    describe('getSample tests', () => {
        it('Should return null (default value)', () => {
            expect(channel.getSample()).to.equal(null);
        });
    });

    describe('setEffect tests', () => {
        it('Should set the given effect on the channel', () => {
            let effect = {
                code: 0,
                p:    71,
                px:   4,
                py:   7
            };
            channel.setEffect(effect);
            expect(channel.getEffect()).to.eql(effect);
        });
    });

    describe('setFinetune tests', () => {
        it('Should set the given finetune value on the channel', () => {
            let finetune = 4;
            channel.setFinetune(finetune);
            expect(channel.getFinetune()).to.equal(finetune);
        });
    });

    describe('setPeriod tests', () => {
        it('Should set the given period value on the channel', () => {
            let period = 8288;
            channel.setPeriod(period);
            expect(channel.getPeriod()).to.equal(period);
        });
    });

    describe('setSample tests', () => {
        it('Should set the given sample on the channel', () => {
            channel.setSample(sample);
            expect(channel.getSample()).to.eql(sample);
        });
    });


    /*********************
     *     Utilities     *
     *********************/
    let checkGeneratedFinetunedSamples = function(finetune) {
        const amigaClockSpeed = 7093789.2;
        const channelBuffer = channel.getBuffer();
        const period = 4144;

        const finetunedPeriod = period * (Math.pow(2, (1/12 * finetune/8)));
        const frequency = amigaClockSpeed / (finetunedPeriod * 2);
        const sampleIncrement = frequency / 44100;

        let i;

        channel.setSample(sample);
        channel.setPeriod(4144);
        channel.setFinetune(finetune);

        channel.fillBuffer(0, 64);

        for(i=0; i<64; i++) {
            let lowerSample = sample.audio[Math.floor(i * sampleIncrement)];
            let upperSample = sample.audio[Math.ceil(i * sampleIncrement)];
            let diff = upperSample - lowerSample;
            let expectedSample = lowerSample + (((i * sampleIncrement) % 1) * diff);
            expect(channelBuffer[i]).to.be.closeTo(expectedSample, 0.0000000000000001);
        }
    };
});