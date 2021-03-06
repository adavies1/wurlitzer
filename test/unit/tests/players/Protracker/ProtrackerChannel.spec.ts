// import { use, expect } from 'chai';
// import ProtrackerChannel from '../../../../../src/players/Protracker/ProtrackerChannel';

// const amigaClockSpeed = 7093789.2;

// describe('ProtrackerChannel tests', () => {
//     const sample = {
//         audio:        new Float32Array(128),
//         name:         'test',
//         length:       128,
//         fineTune:     0,
//         volume:       64,
//         repeatOffset: 0,
//         repeatLength: 0
//     };
//     let channel: ProtrackerChannel;

//     before(() => {
//         // Add some audio data to sample
//         for(let i=0; i<64; i++) {
//             sample.audio[i] = Math.sin((i+1) / 64);
//             sample.audio[i+64] = Math.sin((i+1) / -64);
//         }
//     });

//     beforeEach(() => {
//         channel = new ProtrackerChannel(44100, amigaClockSpeed);
//     });

//     describe('fillBuffer tests', () => {
//         it('Should generate 64 samples for note C-1', () => {
//             checkGeneratedFinetunedSamples(0);
//         });

//         it('Should generate 64 positively finetuned samples', () => {
//             checkGeneratedFinetunedSamples(7);
//         });

//         it('Should generate 64 negatively finetuned samples', () => {
//             checkGeneratedFinetunedSamples(-4);
//         });
//     });

//     // describe('getBuffer tests', () => {
//     //     it('Should return a buffer of length 4096', () => {
//     //         expect(channel.getBuffer().length).to.equal(4096);
//     //     });
//     // });

//     describe('getEffect tests', () => {
//         it('Should return undefined (default value)', () => {
//             expect(channel.getEffect()).to.equal(undefined);
//         });
//     });

//     describe('getFinetune tests', () => {
//         it('Should return 0 (default value)', () => {
//             expect(channel.getFineTune()).to.equal(0);
//         });
//     });

//     describe('getPeriod tests', () => {
//         it('Should return 0 (default value)', () => {
//             expect(channel.getPeriod()).to.equal(0);
//         });
//     });

//     describe('getSample tests', () => {
//         it('Should return null (default value)', () => {
//             expect(channel.getSample()).to.equal(null);
//         });
//     });

//     describe('setInstruction tests', () => {
//         it('Should set the given instruction and effect on the channel', () => {
//             let instruction = {
//                 effect: {
//                     code: 0,
//                     p:    71,
//                     px:   4,
//                     py:   7
//                 },
//                 period: 428,
//                 sampleIndex: 1
//             }
//             channel.setInstruction(instruction);
//             expect(channel.getInstruction()).to.eql(instruction);
//             expect(channel.getEffect()).to.eql(instruction.effect);
//         });
//     });

//     describe('setFinetune tests', () => {
//         it('Should set the given finetune value on the channel', () => {
//             let finetune = 4;
//             channel.setFineTune(finetune);
//             expect(channel.getFineTune()).to.equal(finetune);
//         });
//     });

//     describe('setPeriod tests', () => {
//         it('Should set the given period value on the channel', () => {
//             let period = 8288;
//             channel.setPeriod(period);
//             expect(channel.getPeriod()).to.equal(period);
//         });
//     });

//     describe('setSample tests', () => {
//         it('Should set the given sample on the channel', () => {
//             channel.setSample(sample);
//             expect(channel.getSample()).to.eql(sample);
//         });
//     });


//     /*********************
//      *     Utilities     *
//      *********************/
//     let checkGeneratedFinetunedSamples = function(finetune: number) {
//         const channelBuffer = channel.getBuffer();
//         const period = 4144;

//         const finetunedPeriod = period * (Math.pow(2, (1/12 * finetune/8)));
//         const frequency = amigaClockSpeed / (finetunedPeriod * 2);
//         const sampleIncrement = frequency / 44100;

//         let i;

//         channel.setSample(sample);
//         channel.setPeriod(4144);
//         channel.setFineTune(finetune);

//         channel.fillBuffer(0, 3);

//         for(i=0; i<3; i++) {
//             let lowerSample = sample.audio[Math.floor(i * sampleIncrement)];
//             let upperSample = sample.audio[Math.ceil(i * sampleIncrement)];
//             let diff = upperSample - lowerSample;

//             // JS uses 64bit floats for math, but we store samples in the channelBuffer as 32bit floats.
//             // We need to convert our expected sample, otherwise we'll see mismatches due to rounding errors.
//             let expectedSample = new Float32Array([lowerSample + (((i * sampleIncrement) % 1) * diff)])[0];
//             expect(channelBuffer[i]).to.be.closeTo(expectedSample, 0.0000000000000001);
//         }
//     };
// });
