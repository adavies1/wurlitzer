import Player from "../Player";
import ProtrackerChannel from "./ProtrackerChannel";
import * as reader from "./ProtrackerReader";

export default class Protracker extends Player {
    constructor(audioContext, fileData) {
        super(audioContext, fileData);

        this.amigaClockSpeed     = this.setAmigaClockSpeed('PAL');
        this.buffer              = audioContext.createBuffer(2, audioContext.sampleRate, audioContext.sampleRate);
        this.bufferSourceNode    = audioContext.createBufferSource();
        this.scriptProcessorNode = audioContext.createScriptProcessor(undefined, 1, 2);
        this.channels            = this._createChannels(reader.getChannelCount(fileData));

        // Get all of the read-only properties of the song from the file
        Object.assign(this.song, {
            channelCount:    reader.getChannelCount(fileData),
            patternCount:    reader.getPatternCount(fileData),
            patterns:        reader.getPatterns(fileData),
            patternSequence: reader.getPatternSequence(fileData),
            samples:         reader.getSamples(fileData),
            signature:       reader.getSignature(fileData),
            songLength:      reader.getUsedPatternSequenceLength(fileData),
            songLoop:        reader.getSongLoopPatternSequenceIndex(fileData),
            title:           reader.getTitle(fileData),
        });

        // Set all of the variables used during playback
        this.state = Object.assign(this.state, {
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

        // Set up audioContext / audio nodes
        this._setupAudioNodes();

        this.api = this._getPublicApi();
        return this.api;
    };


    /****************************
     *     Public functions     *
     ****************************/
    getChannels() {
        return this.channels;
    };

    getPlaybackState() {
        return this.state;
    };

    getSong() {
        return this.song;
    };

    nextPattern() {
        return this._setPatternIndex(this.state.currentPatternIndex + 1);
    };

    nextRow() {
        if(this._setRow(this.state.currentRowIndex + 1) === false) {
            return this._nextPattern();
        }
        return true;
    };

    nextSubtrack() {
        if(this.song.hasSubtracks) {
            return this.goToSubtrack(this.state.currentSubtrack + 1);
        }
        return false;
    };

    nextTick() {
        if(this._setTick(this.state.currentTick + 1) === false) {
            return this._nextRow();
        }
        return true;
    };

    previousPattern() {
        this._setPatternIndex(this.state.currentPatternIndex - 1);
    };

    previousRow() {
        if(this._setRow(this.state.currentRowIndex - 1) === false) {
            return this._previousPattern();
        }
        return true;
    };

    previousSubtrack() {
        if(this.song.hasSubtracks) {
            return this.goToSubtrack(this.state.currentSubtrack - 1);
        }
        return false;
    };

    previousTick() {
        if(this._setTick(this.state.currentTick - 1) === false) {
            return this._previousRow();
        }
        return true;
    };

    pause() {
        this.bufferSourceNode.stop();
    };

    play() {
        this.bufferSourceNode.start();
    };

    reset() {
        this._setPatternIndex(0);
        this.channels.forEach(channel => {
            channel.reset();
        });
    };

    setAmigaClockSpeed(region) {
        if(typeof region === 'string') {
            if(region.toUpperCase() === 'PAL') {
                this.amigaClockSpeed = 7093789.2;
            }
            else if(region.toUpperCase === 'NTSC') {
                this.amigaClockSpeed = 7159090.5;
            }
        }
        return this.amigaClockSpeed;
    };

    setPattern() {

    };

    setRow(row) {

    };

    setSubtrack(index) {

    };

    setTick(tick) {

    };


    /***************************
     *     Event functions     *
     ***************************/
    onAudioProcess(event) {
        const samplesToGenerate = this._calculateNumberOfSamplesToGenerate();

        // If this is the start of a new row, assign instruction data to channels
        if(this.state.currentRowIndex === 0 && this.currentTick === 0 && this.state.currentTickSamplePosition === 0) {
            this.channels.forEach((channel, index) => {
                let instruction = this._getCurrentRow()[index];

                if(instruction.effect) {
                    channel.setEffect(instruction.effect);
                }
                if(instruction.finetune) {
                    channel.setFinetune(instruction.finetune);
                }
                if(instruction.period) {
                    channel.setPeriod(instruction.period);
                }
                if(instruction.sampleIndex) {
                    // A sampleIndex of 0 means no sample specified, which means that
                    // Effectively, the samples coming from the instructions are 1-based.
                    // We have to handle this as the sample array is 0-based.
                    channel.setSample(this.samples(instruction.sampleIndex - 1));
                }
            });
        }

        // If this is the start of a tick, process effects for each channel
        if(this.state.currentTickSamplePosition === 0) {
            this.channels.forEach(channel => {
                if(channel.getEffect() !== null) {
                    channel.getEffect().process(this, channel);
                }
            });
        }

        // Get channels to fill their buffers
        this.channels.forEach(channel => {
            channel.fillBuffer(this.state.currentBufferSamplePosition, samplesToGenerate);
        });

        // Record that we have generated our samples
        this.state.currentTickSamplePosition = this.state.currentTickSamplePosition + samplesToGenerate;
        this.state.currentBufferSamplePosition = this.state.currentBufferSamplePosition + samplesToGenerate;

        // If the tick has ended, advance to the next position
        if(this.state.currentTickSamplePosition === this.state.samplesPerTick) {
            this._goToNextPosition();
        }

        // If we need to generate more samples to fully fill the buffers, restart function
        if(this.state.currentBufferSamplePosition !== this.scriptProcessorNode.bufferSize) {
            this.onAudioProcess(event);
        }
        // Otherwise, downmix the channels to stereo (2 channels in the scriptProcessorNode)
        else {
            this._mergeChannelsToOutput(event.outputBuffer);
        }
    };


    /*****************************
     *     Private functions     *
     *****************************/
    _calculateNumberOfSamplesToGenerate() {
        return Math.min(
            this.scriptProcessorNode.bufferSize,
            this.state.samplesPerTick - this.state.currentTickSamplePosition
        );
    };

    _createChannels(channelCount) {
        const channels = [];
        var i;

        for(i=0; i<channelCount; i++) {
            channels.push(new ProtrackerChannel(
                this.scriptProcessorNode.bufferSize,
                this.audioContext.sampleRate,
                this.amigaClockSpeed
            ));
        }

        return channels;
    };

    _getCurrentPattern() {
        return song.patterns[state.currentPatternIndex];
    };

    _getCurrentRow() {
        return song.patterns[state.currentPatternIndex][state.currentRowIndex];
    };

    _goToNextPosition() {
        let nextPosition = (
            this._setTick(this.currentTick + 1) ||
            this._setRowIndex(this.currentRowIndex + 1) ||
            this._setPatternIndex(this.currentPatternIndex + 1)
        );

        // If there was no next position to advance to, attempt to loop
        if(!nextPosition) {
            if(this.song.songLoop !== undefined) {
                this._setPatternIndex(this.song.songLoop);
            }
        }
    };

    _mergeChannelsToOutput(outputBuffer) {
        let left = {};
        let mixDivider;
        let right = {};
        let sum;

        // If song has 4 channels, mimick amiga left/right split (LRRL)
        if(this.songInfo.channelCount === 4) {
            left.mixChannels = [0,3];
            right.mixChannels = [1,2];
        }
        // Otherwise, just assume the channels alternate (LRLRLR...)
        else {
            left.mixChannels = [0..this.songInfo.channelCount].filter(channel => channel % 2 === 0);
            right.mixChannels = [0..this.songInfo.channelCount].filter(channel => channel % 2 !== 0);
        }

        // Assign the outputBuffers for each stereo channel
        left.outputBuffer = outputBuffer.getChannelData(0);
        right.outputBuffer = outputBuffer.getChannelData(1);

        // This is the number we need to divide by when mixing
        mixDivider = Math.max(left.channels.length, right.channels.length);

        // For each stereo channel, loop through samples and mix them into output buffer
        [left, right].forEach(speakerChannel => {
            for(i=0; i<speakerChannel.outputBuffer.length; i++) {
                speakerChannel.mixChannels.forEach(channelIndex => {
                    sum = sum + this.channels[channelIndex].getBuffer()[i];
                });
                speakerChannel.outputBuffer[i] = (sum / mixDivider);
            }
        });
    };

    _setPatternIndex(index) {
        if(this.song.patternList[index]) {
            this.state.currentPatternIndex = index;
            this._setRowIndex(0);
            this._setTick(0);
            return true;
        }
        return false;
    };

    _setRowIndex(index) {
        if(this._getCurrentPattern()[index]) {
            this.state.currentRowIndex = index;
            this._setTick(0);
            return true;
        }
        return false;
    };

    _setTick(tick) {
        if(tick < this.song.ticksPerRow) {
            this.song.currentTick = tick;
            this.state.currentBufferSamplePosition = 0;
            this.state.currentTickSamplePosition = 0;
            return true;
        }
        return false;
    };

    _setupAudioNodes() {
        // Set bufferSoureNode to looping so that the bufferSourceNode never stops
        this.bufferSourceNode.loop = true;

        // Add function to allow the scriptProcessorNode to process audio data
        this.scriptProcessorNode.onAudioProcess = () => this.onAudioProcess;

        // Connect everything up
        this.bufferSourceNode.buffer = this.buffer;
        this.bufferSourceNode.connect(this.scriptProcessorNode);
        this.scriptProcessorNode.connect(this.audioContext.destination);
    };
}