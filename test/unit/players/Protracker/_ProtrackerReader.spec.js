import {use, expect} from 'chai';
import * as ProtrackerReader from '../../../../src/players/Protracker/ProtrackerReader';

let modFileArrayBuffer = FileReader.prototype.readAsArrayBuffer(global.config.modFilePath);

describe('ProtrackerReader tests', () => {
    before(() => {
        //modFileArrayBuffer = FileReader.prototype.readAsArrayBuffer(global.config.modFilePath);
    });

    describe('getChannelCount tests', (done) => {
        // Expand this to check every kind of module
        it('Should detect the correct number of channels for a module', () => {
            expect(ProtrackerReader.getChannelCount(modFileArrayBuffer)).to.equal(4);
        });
    });

    describe('getFormatDescription tests', (done) => {
        it('Should identify the module as ProTracker', () => {
            expect(ProtrackerReader.getFormatDescription(modFileArrayBuffer)).to.equal('ProTracker');
        })
    });

    describe('getPatternCount tests', (done) => {
        it('Should detect the correct number of patterns for a module', ()=> {
            expect(ProtrackerReader.getPatternCount(modFileArrayBuffer)).to.equal(14);
        });
    });

    describe('getPatterns tests', (done) => {
        it('Should return a 3D array [14][64][4]', ()=> {
            let patterns = ProtrackerReader.getPatterns(modFileArrayBuffer);
            expect(Array.isArray(patterns)).to.equal(true);
            expect(patterns.length).to.equal(14);

            // Check that each pattern holds 64 rows
            patterns.forEach(pattern => {
                expect(Array.isArray(pattern)).to.equal(true);
                expect(pattern.length).to.equal(64);

                // Check that each row holds 4 channel instructions
                pattern.forEach(row => {
                    expect(Array.isArray(row)).to.equal(true);
                    expect(row.length).to.equal(4);
                });
            });
        });

        describe('Check integrity of each instruction', () => {
            let patterns = ProtrackerReader.getPatterns(modFileArrayBuffer);

            it('Should have valid sample indexes', () => {
                patterns.forEach(pattern => {
                    pattern.forEach(row => {
                        row.forEach(instruction => {
                            expect(typeof instruction.sampleIndex).to.equal('number');
                            expect(instruction.sampleIndex).to.be.within(0,31);
                        });
                    });
                });
            });

            it('Should have valid period values', () => {
                patterns.forEach(pattern => {
                    pattern.forEach(row => {
                        row.forEach(instruction => {
                            expect(typeof instruction.period).to.equal('number');
                            expect(instruction.period).to.be.within(0,856);
                        });
                    });
                });
            });

            it('Should have an effect object', () => {
                patterns.forEach(pattern => {
                    pattern.forEach(row => {
                        row.forEach(instruction => {
                            expect(typeof instruction.effect).to.equal('object');
                        });
                    });
                });
            });

            describe('Check integrity of each effect', () => {
                it('Should have a valid effect code', () => {
                    patterns.forEach(pattern => {
                        pattern.forEach(row => {
                            row.forEach(instruction => {
                                expect(typeof instruction.effect.code).to.equal('number');
                                expect(instruction.effect.code).to.be.within(0,15);
                            });
                        });
                    });
                });

                it('Should have a valid effect parameters', () => {
                    patterns.forEach(pattern => {
                        pattern.forEach(row => {
                            row.forEach(instruction => {
                                expect(typeof instruction.effect.p).to.equal('number');
                                expect(typeof instruction.effect.px).to.equal('number');
                                expect(instruction.effect.px).to.be.within(0,15);
                                expect(typeof instruction.effect.py).to.equal('number');
                                expect(instruction.effect.py).to.be.within(0,15);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('getPatternSequence tests', (done) => {
        let sequence = ProtrackerReader.getPatternSequence(modFileArrayBuffer);

        it('Should return a pattern sequence with 16 indexes', () => {
            expect(sequence.length).to.equal(16);
        });

        it('Should return only numeric pattern index values that are >= 0', () => {
            sequence.forEach(patternIndex => {
                expect(typeof patternIndex).to.equal('number');
                expect(patternIndex).to.be.above(-1);
            });
        });

        it('Should return the correct pattern sequence', () => {
            expect(sequence).to.deep.equal([0,1,2,3,4,3,5,6,7,8,9,10,11,11,12,13]);
        })
    });

    describe('getSamples tests', (done) => {
        it('Should return an array with 31 samples', () => {
            expect(ProtrackerReader.getSamples(modFileArrayBuffer).length).to.equal(31);
        });

        describe('Check integrity of each sample', () => {
            let samples = ProtrackerReader.getSamples(modFileArrayBuffer);

            it('Should return valid sample names', () => {
                samples.forEach(sample => {
                    expect(typeof sample.name).to.equal('string');
                    expect(sample.name.length).to.equal(22);
                });
            });

            it('Should return valid sample lengths', () => {
                samples.forEach(sample => {
                    expect(typeof sample.length).to.equal('number');
                });
            });

            it('Should return valid finetune values', () => {
                samples.forEach(sample => {
                    expect(typeof sample.fineTune).to.equal('number');
                    expect(sample.fineTune).to.be.within(-7,8);
                });
            });

            it('Should return valid volume values', () => {
                samples.forEach(sample => {
                    expect(typeof sample.volume).to.equal('number');
                    expect(sample.volume).to.be.within(0,64);
                });
            });

            it('Should return valid repeat length values', () => {
                samples.forEach(sample => {
                    expect(typeof sample.repeatLength).to.equal('number');
                    expect(sample.repeatLength).to.be.above(-1);
                });
            });

            it('Should return valid repeat offset values', () => {
                samples.forEach(sample => {
                    expect(typeof sample.repeatOffset).to.equal('number');
                    expect(sample.repeatOffset).to.be.above(-1);
                });
            });
        });
    });

    describe('getSignature tests', (done) => {
        it('Should return the signature "M.K."', () => {
            expect(ProtrackerReader.getSignature(modFileArrayBuffer)).to.equal('M.K.');
        });
    });

    describe('getSongLoopPatternSequenceIndex tests', (done) => {
        it('Should return the pattern sequence index used when looping', () => {
            expect(ProtrackerReader.getSongLoopPatternSequenceIndex(modFileArrayBuffer)).to.equal(undefined);
        });
    });

    describe('getTitle tests', (done) => {
        it('Should return the title (which is blank)', () => {
            expect(ProtrackerReader.getTitle(modFileArrayBuffer)).to.equal('');
        });
    });

    describe('getUsedPatternSequenceLength tests', (done) => {
        it('Should return the number of used pattern sequence slots', () => {
            expect(ProtrackerReader.getUsedPatternSequenceLength(modFileArrayBuffer)).to.equal(16);
        });
    })

    after(() => {

    })
})
