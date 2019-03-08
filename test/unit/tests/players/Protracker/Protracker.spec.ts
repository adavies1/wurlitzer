import { use, expect } from 'chai';
import { Protracker, State }  from '../../../../../src/players/Protracker/Protracker';

import * as testConstants from '../../../resources/constants';
import * as utils from '../../../../../src/utils';
import { ProtrackerChannel, state } from '../../../../../src/players/Protracker/ProtrackerChannel';

describe('Protracker tests', () => {
    let fileData: ArrayBuffer;
    let protracker: Protracker;

    before(() => {
        return utils.loadFileFromUrl(testConstants.MOD_FILE_URL)
        .then((data) => {
            fileData = data;
        });
    });

    beforeEach(() => {
        protracker = new Protracker(fileData);
    })

    it('Should create a protracker instance', () => {
        expect(protracker instanceof Protracker);
        checkStateHasBeenReset(protracker.getPlaybackState());
    });

    describe('getChannels tests', () => {
        it('should return an array of ProtrackerChannels', () => {
            let channels = protracker.getChannels();

            expect(Array.isArray(channels)).to.equal(true);
            expect(channels.length).to.equal(4);

            channels.forEach(channel => {
                expect(channel instanceof ProtrackerChannel);
            })
        });
    });

    describe('getPlaybackState tests', () => {
        it('should return an object that holds the state data', () => {
            expect(typeof protracker.getPlaybackState()).to.equal('object');
        });
    });

    describe('getSong tests', () => {
        it('should return an object that holds the song data', () => {
            expect(typeof protracker.getSong()).to.equal('object');
        });
    });

    describe('hasSubtracks tests', () => {
        it('should return a boolean flag indicating if the song has subtracks or not', () => {
            expect(!protracker.hasSubtracks());
        });
    });

    describe('isFileSupported tests', () => {
        // isFileSupported() is covered by tests in ProtrackerReader.spec, so we won't go into great depth here
        it('should return a boolean flag indicating if the song is supported or not', () => {
            expect(protracker.isFileSupported(fileData));
            expect(!protracker.isFileSupported(new ArrayBuffer(8096)));
        });
    });

    describe('nextPattern tests', () => {
        it('should increment the pattern sequence index by 1 and set row and tick to 0', () => {
            protracker.setRowIndex(1);
            protracker.setTick(1);
            const success = protracker.nextPattern();
            const finalState = protracker.getPlaybackState();

            expect(finalState.currentPatternSequenceIndex).to.equal(1);
            expect(finalState.currentRowIndex).to.equal(0);
            expect(finalState.currentTick).to.equal(0);
            expect(success);
        });

        it('should fail to increment the pattern sequence index if we are at the end', () => {
            protracker.setPatternSequenceIndex(15);
            protracker.setRowIndex(1);
            protracker.setTick(1);
            const success = protracker.nextPattern();
            const finalState = protracker.getPlaybackState();

            console.log(finalState);

            expect(finalState.currentPatternSequenceIndex).to.equal(15);
            expect(finalState.currentRowIndex).to.equal(1);
            expect(finalState.currentTick).to.equal(1);
            expect(!success);
        });
    });

    describe('nextRow tests', () => {
        it('should increment the row index by 1', () => {
            protracker.setTick(1);
            const success = protracker.nextRow();
            const finalState = protracker.getPlaybackState();

            expect(finalState.currentRowIndex).to.equal(1);
            expect(finalState.currentTick).to.equal(0);
            expect(success);
        });

        it('should increment the pattern index by 1 and set row/tick index to 0 if we are at the end of a pattern', () => {
            protracker.setRowIndex(63);
            protracker.setTick(1);
            const success = protracker.nextRow();
            const finalState = protracker.getPlaybackState();

            expect(finalState.currentPatternSequenceIndex).to.equal(1);
            expect(finalState.currentRowIndex).to.equal(0);
            expect(finalState.currentTick).to.equal(0);
            expect(success);
        });

        it('should fail to increment the row index if we are at the final row', () => {
            protracker.setPatternSequenceIndex(15);
            protracker.setRowIndex(63);
            protracker.setTick(1);
            const success = protracker.nextRow();
            const finalState = protracker.getPlaybackState();

            expect(finalState.currentPatternSequenceIndex).to.equal(15);
            expect(finalState.currentRowIndex).to.equal(63);
            expect(finalState.currentTick).to.equal(1);
            expect(!success);
        });
    });

    describe('nextSubtrack tests', () => {
        // it('Should go to the next subtrack', () => {
        //     const success = protracker.nextSubtrack();
        //     const finalState = protracker.getPlaybackState();

        //     expect(success);
        //     expect(finalState.currentSubtrack).to.equal(1);
        // });

        it('Should fail if the song does not have subtracks', () => {
            const success = protracker.nextSubtrack();
            const finalState = protracker.getPlaybackState();

            expect(!success);
            expect(finalState.currentSubtrack).to.equal(0);
        });

        // it('Should fail if the song has subtracks, but the last one is already selected', () => {
        //     const success = protracker.nextSubtrack();
        //     const finalState = protracker.getPlaybackState();

        //     expect(!success);
        //     expect(finalState.currentSubtrack).to.equal(0);
        // });
    })

    describe('nextTick tests', () => {
        it('should increment the tick index by 1', () => {
            const success = protracker.nextTick();
            const finalState = protracker.getPlaybackState();

            expect(finalState.currentPatternSequenceIndex).to.equal(0);
            expect(finalState.currentRowIndex).to.equal(0);
            expect(finalState.currentTick).to.equal(1);
            expect(success);
        });

        it('should increment the row index by 1 and set tick index to 0 if we are at the end of a row', () => {
            protracker.setTick(5);
            const success = protracker.nextTick();
            const finalState = protracker.getPlaybackState();

            expect(finalState.currentPatternSequenceIndex).to.equal(0);
            expect(finalState.currentRowIndex).to.equal(1);
            expect(finalState.currentTick).to.equal(0);
            expect(success);
        });

        it('should fail to increment the row index if we are at the final row', () => {
            protracker.setPatternSequenceIndex(15);
            protracker.setRowIndex(63);
            protracker.setTick(5);
            const success = protracker.nextTick();
            const finalState = protracker.getPlaybackState();

            expect(finalState.currentPatternSequenceIndex).to.equal(15);
            expect(finalState.currentRowIndex).to.equal(63);
            expect(finalState.currentTick).to.equal(5);
            expect(!success);
        });
    });

    describe('pause tests', () => {
        it('Should set the status to "PAUSED" if the song is currently playing', () => {
            const initialStatus = protracker.getPlaybackStatus();
            protracker.play();
            const success = protracker.pause();
            const finalStatus = protracker.getPlaybackStatus();

            expect(initialStatus).to.equal('STOPPED');
            expect(finalStatus).to.equal('PAUSED');
            expect(success);
        });

        it('Should not set the status to "PAUSED" if the song is currently stopped', () => {
            const initialStatus = protracker.getPlaybackStatus();
            const success = protracker.pause();
            const finalStatus = protracker.getPlaybackStatus();

            expect(initialStatus).to.equal('STOPPED');
            expect(finalStatus).to.equal('STOPPED');
            expect(!success);
        });
    });

    describe('play tests', () => {
        it('Should set the status to "PLAYING"', () => {
            const initialStatus = protracker.getPlaybackStatus();
            const success = protracker.play();
            const finalStatus = protracker.getPlaybackStatus();

            expect(initialStatus).to.equal('STOPPED');
            expect(finalStatus).to.equal('PLAYING');
            expect(success);
        });
    });

    describe('previousPattern tests', () => {
        it('should decrement the pattern sequence index by 1 and set row and tick to 0', () => {
            protracker.setPatternSequenceIndex(2);
            protracker.setRowIndex(2);
            protracker.setTick(1);
            const success = protracker.previousPattern();
            const finalState = protracker.getPlaybackState();

            expect(finalState.currentPatternSequenceIndex).to.equal(1);
            expect(finalState.currentRowIndex).to.equal(0);
            expect(finalState.currentTick).to.equal(0);
            expect(success);
        });

        it('should fail to decrement the pattern sequence index if we are at the start', () => {
            protracker.setPatternSequenceIndex(0);
            protracker.setRowIndex(1);
            protracker.setTick(1);
            const success = protracker.previousPattern();
            const finalState = protracker.getPlaybackState();

            expect(finalState.currentPatternSequenceIndex).to.equal(0);
            expect(finalState.currentRowIndex).to.equal(1);
            expect(finalState.currentTick).to.equal(1);
            expect(!success);
        });
    });

    describe('previousRow tests', () => {
        it('should decrement the row index by 1', () => {
            protracker.setRowIndex(2);
            protracker.setTick(1);
            const success = protracker.previousRow();
            const finalState = protracker.getPlaybackState();

            expect(finalState.currentRowIndex).to.equal(1);
            expect(finalState.currentTick).to.equal(0);
            expect(success);
        });

        it('should decrement the pattern index by 1, set row index to 63 and set tick to 0 if we are at the start of a pattern', () => {
            protracker.setPatternSequenceIndex(2);
            protracker.setRowIndex(0);
            protracker.setTick(1);
            const success = protracker.previousRow();
            const finalState = protracker.getPlaybackState();

            expect(finalState.currentPatternSequenceIndex).to.equal(1);
            expect(finalState.currentRowIndex).to.equal(63);
            expect(finalState.currentTick).to.equal(0);
            expect(success);
        });

        it('should fail to decrement the row index if we are at the first row', () => {
            protracker.setPatternSequenceIndex(0);
            protracker.setRowIndex(0);
            protracker.setTick(1);
            const success = protracker.previousRow();
            const finalState = protracker.getPlaybackState();

            expect(finalState.currentPatternSequenceIndex).to.equal(0);
            expect(finalState.currentRowIndex).to.equal(0);
            expect(finalState.currentTick).to.equal(1);
            expect(!success);
        });
    });

    describe('previousSubtrack tests', () => {
        // it('Should go to the previous subtrack', () => {
            //     protracker.nextSubtrack();
            //     expect(protracker.getPlaybackState().currentSubtrack).to.equal(1);

        //     const success = protracker.previousSubtrack();
        //     const finalState = protracker.getPlaybackState();

        //     expect(success);
        //     expect(finalState.currentSubtrack).to.equal(1);
        // });

        it('Should fail if the song does not have subtracks', () => {
            const success = protracker.previousSubtrack();
            const finalState = protracker.getPlaybackState();

            expect(!success);
            expect(finalState.currentSubtrack).to.equal(0);
        });

        // it('Should fail if the song has subtracks, but the first one is already selected', () => {
        //     const success = protracker.previousSubtrack();
        //     const finalState = protracker.getPlaybackState();

        //     expect(!success);
        //     expect(finalState.currentSubtrack).to.equal(0);
        // });
    });

    describe('previousTick tests', () => {
        it('should decrement the tick index by 1', () => {
            protracker.setTick(4);
            const success = protracker.previousTick();
            const finalState = protracker.getPlaybackState();

            expect(finalState.currentPatternSequenceIndex).to.equal(0);
            expect(finalState.currentRowIndex).to.equal(0);
            expect(finalState.currentTick).to.equal(3);
            expect(success);
        });

        it('should decrement the row index by 1 and set tick index to 0 if we are at the end of a row', () => {
            protracker.setRowIndex(1);
            const success = protracker.previousTick();
            const finalState = protracker.getPlaybackState();

            expect(finalState.currentPatternSequenceIndex).to.equal(0);
            expect(finalState.currentRowIndex).to.equal(0);
            expect(finalState.currentTick).to.equal(5);
            expect(success);
        });

        it('should fail to decrement the row index if we are at the first row', () => {
            const success = protracker.previousTick();
            const finalState = protracker.getPlaybackState();

            expect(finalState.currentPatternSequenceIndex).to.equal(0);
            expect(finalState.currentRowIndex).to.equal(0);
            expect(finalState.currentTick).to.equal(0);
            expect(!success);
        });
    });

    describe('reset tests', () => {
        it('should reset the song state', () => {
            protracker.setPatternSequenceIndex(1);
            protracker.setRowIndex(1);
            protracker.setTick(1);
            protracker.play();

            protracker.reset();
            const finalState = protracker.getPlaybackState();
            console.log('hello - ', finalState);
            expect(finalState).to.eql({
                currentBufferSamplePosition: 0,
                currentPatternSequenceIndex: 0,
                currentRowIndex:             0,
                currentSubtrack:             0,
                currentTickSamplePosition:   0,
                currentTick:                 0,
                rowsPerBeat:                 4,
                samplesPerTick:              0,
                speed:                       6,
                tempo:                       125,
            } as State);
        });
    });

});


/*********************
 *     Utilities     *
 *********************/
function checkStateHasBeenReset(state: State) {
    expect(state.currentBufferSamplePosition).to.equal(0);
    expect(state.currentPatternSequenceIndex).to.equal(0);
    expect(state.currentRowIndex).to.equal(0);
    expect(state.currentSubtrack).to.equal(0);
    expect(state.currentTick).to.equal(0);
    expect(state.currentTickSamplePosition).to.equal(0);
}
