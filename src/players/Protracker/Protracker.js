import Player from "Player";
import ProtrackerChannel from "ProtrackerChannel";
import * as reader from "ProtrackerReader";

class Protracker extends Player {
    constructor(audioContext, fileData) {
        super(audioContext, fileData);

        // We'll use this to actually output the sound
        this.bufferLength        = 4096;
        this.scriptProcessorNode = audioContext.createScriptProcessor(4096, 0, 2);

        // Get all of the read-only properties of the song from the file
        Object.assign(this.song, {
            channelCount:    reader.getChannelCount(fileData),
            patternCount:    reader.getPatternCount(fileDate),
            signature:       reader.getSignature(fileData),
            title:           reader.getTitle(fileData),
            patternSequence: reader.getPatternSequence(fileData),
            patterns:        reader.getPatterns(fileData),
            samples:         reader.getSamples(fileData),
        });

        // Set all of the variables used during playback
        this.state = Object.assign(this.state, {
            channels:                    this._createChannels(this.song.channelCount),
            currentBufferSamplePosition: 0,
            currentPatternIndex:         0,
            currentRowIndex:             0,
            currentTickSamplePosition:   0,
            currentTick:                 0,
            rowsPerPattern:              0,
            samplesPerTick:              0,
            speed:                       0,
            ticksPerRow:                 0,
        });

        this.api = Object.assign(this.api, {

        });
    };


    /****************************
     *     Public functions     *
     ****************************/
    getSongInfo() {
        return this.song;
    };

    goToNextPattern() {
        return this._setPatternIndex(this.state.currentPatternIndex + 1);
    };

    goToNextSubtrack() {
        if(this.song.hasSubtracks) {
            return this.goToSubtrack(this.state.currentSubtrack + 1);
        }
        return false;
    };

    goToNextTick() {
        if(this._setTick(this.state.currentTick + 1) === false) {
            return this._goToNextRow();
        }
        return true;
    };

    goToNextRow() {
        if(this._setRow(this.state.currentRowIndex + 1) === false) {
            return this._goToNextPattern();
        }
        return true;
    };

    goToPreviousPattern() {
        this._setPatternIndex(this.state.currentPatternIndex - 1);
    };

    goToPreviousRow() {
        if(this._setRow(this.state.currentRowIndex - 1) === false) {
            return this._goToPreviousPattern();
        }
        return true;
    };

    goToPreviousSubtrack() {
        if(this.song.hasSubtracks) {
            return this.goToSubtrack(this.state.currentSubtrack - 1);
        }
        return false;
    }

    goToPreviousTick() {
        if(this._setTick(this.state.currentTick - 1) === false) {
            return this._goToPreviousRow();
        }
        return true;
    }

    goToSubtrack(index) {
        if(this.song.hasSubtracks) {
            // FIXME
        }
        return false;
    };

    pause() {

    };

    play() {

    };

    reset() {
        var i;

        this._setPatternIndex(0);
        for(i=0; i<this.state.channels.length; i++) {
            this.state.channels[i].reset();
        }
    };

    setTick(tick) {

    }

    skipToPosition() {

    };

    stop() {
        this.pause();
        this.reset();
        this.state.status = 'STOPPED';
    }


    /***************************
     *     Event functions     *
     ***************************/
    onAudioProcess(event) {
        var bufferStart = 0;
        var i;
        var previousSongPosition = this._getSongPosition(this.song, this.state);
        var samplesToGenerate = 0;
        var tickFinished = false;

        // If this is the start of a row, process the song-level effects
        if(this.state.currentTick === 0 && this.state.currentTickSamplePosition === 0) {
            for(i=0; i<channels.length; i++) {
                this.state = this.processSongLevelEffect(
                    this.song,
                    this.state,
                    this._getCurrentRow(this.song, this.state)[i]
                );

                // If the song position has changed, we need to start this function again from the beginning
                if(this.previousSongPosition !== this._getSongPosition(this.state)) {
                    return this.onAudioProcess(event);
                }
            }
        }

        // Figure out how many samples we need to generate
        samplesToGenerate = Math.min(
            this.bufferLength,
            this.state.samplesPerTick - this.state.currentTickSamplePosition
        );

        // Get channels to fill their buffers
        for(i=0; i<this.state.channels.length; i++) {
            this.state.channels[i].fillBuffer(this.state.currentBufferSamplePosition, samplesToGenerate);
        }

        // Record that we have generated our samples
        this.state.currentTickSamplePosition = this.state.currentTickSamplePosition + samplesToGenerate;
        this.state.currentBufferSamplePosition = this.state.currentBufferSamplePosition + samplesToGenerate;

        // If the tick has ended, advance to the next position
        if(this.state.currentTickSamplePosition + 1 === this.state.samplesPerTick) {
            this.state = this._goToNextTick(this.song, this.state);
        }

        // If we need to generate more samples to fully fill the buffers, restart function
        if(this.state.currentBufferSamplePosition + 1 !== this.bufferLength) {
            return this.onAudioProcess(event);
        }

        // Now merge the channel audio data together into the scriptProcesorNode
        if(this.songInfo.channelCount === 4) {
            // Left audio channel
            for(i=0; i<this.bufferLength; i++) {
                // FIXME
                var output = event.outputBuffer.getChannelData(0);
                output[i] = (this.state.channels[0].bufferData[i] + this.state.channels[3].bufferData[i]) / 2;
            }
            // Right audio channel
            for(i=0; i<this.bufferLength; i++) {
                // FIXME
                var output = event.outputBuffer.getChannelData(1);
                output[i] = (this.state.channels[1].bufferData[i] + this.state.channels[2].bufferData[i]) / 2;
            }
        }
        else {
            // 8 channel song... ?
        }
    };


    /*****************************
     *     Private functions     *
     *****************************/
    _createChannels(channelCount) {
        const channels = [];
        var i;

        for(i=0; i<channelCount; i++) {
            channels.push(new ProtrackerChannel(this.bufferLength));
        }

        return channels;
    };

    _getCurrentPattern() {
        return song.patterns[state.currentPatternIndex];
    };

    _getCurrentRow() {
        return song.patterns[state.currentPatternIndex][state.currentRowIndex];
    };

    _getSongPosition(state) {
        return `${state.currentPattern}-${state.currentRow}-${state.currentTick}`;
    };

    _processSongLevelEffect(song, state, instruction) {

    };

    _setPatternIndex(index) {
        if(this.song.patternList[index]) {
            this.state.currentPatternIndex = index;
            this._setRowIndex(0);
            this._setTick(0);
            return true;
        }
        return false;
    }

    _setRowIndex(index) {
        if(this._getCurrentPattern()[index]) {
            this.state.currentRowIndex = index;
            this._setTick(0);
            return true;
        }
        return false;
    }

    _setTick(tick) {
        if(tick < this.song.ticksPerRow) {
            this.song.currentTick = tick;
            this.state.currentBufferSamplePosition = 0;
            this.state.currentTickSamplePosition = 0;
            return true;
        }
        return false;
    };
}