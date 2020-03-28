import * as protrackerConstants from './constants';
import * as appConstants from '../../constants';

import { Instruction } from './models/Instruction.interface';
import { Sample } from './models/Sample.interface';

import Player from "../Player";
import { ProtrackerChannel } from "./ProtrackerChannel";
import * as reader from "./ProtrackerReader";
import * as effects from './effects';
import { mergeChannelsToOutput } from '../../utils';

export interface Song {
    channelCount:    number;
    patternCount:    number;
    patterns:        Instruction[][][];
    patternSequence: number[];
    rowsPerPattern:  number,
    samples:         Sample[];
    signature:       string;
    songLength:      number;
    songLoop:        number;
    title:           string;
};

export interface State {
    currentBufferSamplePosition: number,
    currentPatternSequenceIndex: number,
    currentRowIndex:             number,
    currentSubtrack:             number,
    currentTickSamplePosition:   number,
    currentTick:                 number,
    rowsPerBeat:                 number,
    samplesPerTick:              number, // 2500/bpm
    speed:                       number, // A.K.A ticks-per-row
    tempo:                       number, // A.K.A beats-per-minue (BPM).
}

export class Protracker extends Player {
    amigaClockSpeed     : number                = protrackerConstants.AMIGA_CLOCK_SPEED_PAL;
    buffer              : AudioBuffer;
    bufferSourceNode    : AudioBufferSourceNode;
    channels            : ProtrackerChannel[]   = [];
    scriptProcessorNode : ScriptProcessorNode;
    song                : Song;
    state               : State;

    constructor(fileData: ArrayBuffer) {
        super();

        // Get all of the read-only properties of the song from the file
        this.song = {
            channelCount:    reader.getChannelCount(fileData),
            patternCount:    reader.getPatternCount(fileData),
            patterns:        reader.getPatterns(fileData),
            patternSequence: reader.getPatternSequence(fileData),
            rowsPerPattern:  reader.getRowsPerPattern(fileData),
            samples:         reader.getSamples(fileData, true),
            signature:       reader.getSignature(fileData),
            songLength:      reader.getUsedPatternSequenceLength(fileData),
            songLoop:        reader.getSongLoopPatternSequenceIndex(fileData),
            title:           reader.getTitle(fileData),
        };

        this.reset();
    };


    /****************************
     *     Public functions     *
     ****************************/

    getChannels(): ProtrackerChannel[] {
        return this.channels;
    };

    getPlaybackState(): State {
        return this.state
    };

    getPlaybackStatus(): appConstants.PlayerStatus {
        return this.status;
    };

    getSong(): Song {
        return this.song;
    };

    hasSubtracks(): boolean {
        // TODO: Add subtrack support
        return false;
    };

    isFileSupported(fileData: ArrayBuffer): boolean {
        return reader.isFileSupported(fileData);
    };

    nextPattern(): boolean {
        return this.setPatternSequenceIndex(this.state.currentPatternSequenceIndex + 1);
    };

    nextRow(): boolean {
        return this.setRowIndex(this.state.currentRowIndex + 1) || this.nextPattern();
    };

    nextSubtrack(): boolean {
        return this.setSubtrack(this.state.currentSubtrack + 1);
    };

    nextTick(): boolean {
        return this.setTick(this.state.currentTick + 1) || this.nextRow();
    };

    pause(): boolean {
        if(this.status === appConstants.PlayerStatus.PLAYING) {
            this.scriptProcessorNode.disconnect(appConstants.AUDIO_CONTEXT.destination);
            this.status = appConstants.PlayerStatus.PAUSED;
            return true;
        }
        return false;
    };

    play(): boolean {
        try {
            this.bufferSourceNode.start();
        } catch(e) {
            // You cant start the bufferSourceNode twice, it throws an error. Ignore.
        }

        this.scriptProcessorNode.connect(appConstants.AUDIO_CONTEXT.destination);
        this.status = appConstants.PlayerStatus.PLAYING;
        return true;
    };

    previousPattern(): boolean {
        return this.setPatternSequenceIndex(this.state.currentPatternSequenceIndex - 1);
    };

    previousRow(): boolean {
        if(!this.setRowIndex(this.state.currentRowIndex - 1)) {
            return this.previousPattern() && this.setRowIndex(this.song.rowsPerPattern - 1);
        }
        return true;
    };

    previousSubtrack(): boolean {
        return this.setSubtrack(this.state.currentSubtrack - 1);
    };

    previousTick(): boolean {
        if(!this.setTick(this.state.currentTick - 1)) {
            if(this.previousRow()) {
                this.setTick(this.state.speed - 1);
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return true;
        }
    };

    reset(): void {
        this.state = {
            currentBufferSamplePosition: 0,
            currentPatternSequenceIndex: 0,
            currentRowIndex:             0,
            currentSubtrack:             (this.state ? this.state.currentSubtrack : 0),
            currentTickSamplePosition:   0,
            currentTick:                 0,
            rowsPerBeat:                 4,
            samplesPerTick:              0,
            speed:                       6,
            tempo:                       125,
        };

        // Create channels and audio nodes
        this._setupAudioNodes();
        this._setupChannels(this.song.channelCount);

        this.state.samplesPerTick = this._calculateSamplesPerTick();
    };

    setAmigaClockSpeed(clockSpeed: protrackerConstants.AMIGA_CLOCK_SPEED): void {
        this.amigaClockSpeed = clockSpeed;
    };

    setPatternSequenceIndex(index: number, zeroOnFail: boolean = false): boolean {
        if(typeof this.song.patternSequence[index] !== 'undefined') {
            this.state.currentPatternSequenceIndex = index;
            this.setRowIndex(0);
            return true;
        }
        if(zeroOnFail) {
            this.state.currentPatternSequenceIndex = 0;
            this.setRowIndex(0);
            return true;
        }
        return false;
    };

    setRowIndex(index: number): boolean {
        if(this._getCurrentPattern()[index]) {
            this.state.currentRowIndex = index;
            this.setTick(0);
            return true;
        }
        return false;
    };

    setSubtrack(index: number): boolean {
        // TODO: Add subtrack support
        return false;
    };

    setTick(tick: number): boolean {
        if(tick < this.state.speed && tick >= 0) {
            this.state.currentTick = tick;
            this.state.currentTickSamplePosition = 0;
            return true;
        }
        return false;
    };

    skipToPosition(newPosition: number): boolean {
        return false;
    };


    /***************************
     *     Event functions     *
     ***************************/

    onAudioProcess(event: AudioProcessingEvent): void {
        if(this._isStartofRow()) {
            this._assignInstructionsToChannels(this._getCurrentRow());
            this._processEffects(effects.onRowStart);
        }

        if(this._isStartOfTick()) {
            this._processEffects(effects.onTickStart);
            this.state.samplesPerTick = this._calculateSamplesPerTick();
        }

        this._fillBuffers();

        if (this._isEndOfRow()) {
            this._processEffects(effects.onRowEnd);
        }

        if(this._isEndOfTick()) {
            this._goToNextPosition();
        }

        if(!this._isBufferFull()) {
            this.onAudioProcess(event);
        }
        else {
            mergeChannelsToOutput(event.outputBuffer, this.channels);
            this.state.currentBufferSamplePosition = 0;
        }
    };


    /*****************************
     *     Private functions     *
     *****************************/

    private _assignInstructionsToChannels(row: Instruction[]): void {
        this.channels.forEach((channel, index) => {
            const instruction = row[index];

            channel.setInstruction(instruction);

            if(instruction.sampleIndex) {
                // A sampleIndex of 0 means no sample specified, which means that
                // Effectively, the samples coming from the instructions are 1-based.
                // We have to handle this as the sample array is 0-based.
                channel.setSample(this.song.samples[instruction.sampleIndex - 1]);
                channel.resetVolume();
            }

            if(instruction.period && !effects.isTonePortamento(instruction.effect)) {
                channel.resetFineTune();
                channel.setOriginalPeriod(instruction.period);
                channel.resetSample();
            }
        });
    }

    private _calculateNumberOfSamplesToGenerate(): number {
        return Math.min(
            this.state.samplesPerTick - this.state.currentTickSamplePosition,
            this.scriptProcessorNode.bufferSize - this.state.currentBufferSamplePosition
        );
    };

    private _calculateSamplesPerTick(): number {
        const tickDurationMs = (2500 / this.state.tempo);
        return Math.round(appConstants.AUDIO_CONTEXT.sampleRate * (tickDurationMs / 1000));
    }

    private _fillBuffers(): void {
        const samplesToGenerate = this._calculateNumberOfSamplesToGenerate();

        this.channels.forEach(channel => {
            channel.fillBuffer(this.state.currentBufferSamplePosition, samplesToGenerate);
        });

        this.state.currentTickSamplePosition = this.state.currentTickSamplePosition + samplesToGenerate;
        this.state.currentBufferSamplePosition = this.state.currentBufferSamplePosition + samplesToGenerate;
    }

    private _getCurrentPattern(): Instruction[][] {
        return this.song.patterns[this.song.patternSequence[this.state.currentPatternSequenceIndex]];
    };

    private _getCurrentRow(): Instruction[] {
        return this._getCurrentPattern()[this.state.currentRowIndex];
    };

    private _goToNextPosition(): boolean {
        let nextPosition = (
            this.setTick(this.state.currentTick + 1) ||
            this.setRowIndex(this.state.currentRowIndex + 1) ||
            this.setPatternSequenceIndex(this.state.currentPatternSequenceIndex + 1)
        );

        // If there was no next position to advance to, attempt to loop
        if(!nextPosition && this.song.songLoop !== undefined) {
            return this.setPatternSequenceIndex(this.song.songLoop);
        }
        else {
            return nextPosition;
        }
    };

    private _isBufferFull(): boolean {
        return this.state.currentBufferSamplePosition === this.scriptProcessorNode.bufferSize;
    }

    private _isEndOfRow(): boolean {
        return this.state.currentTick === this.state.speed - 1 && this._isEndOfTick();
    }

    private _isEndOfTick(): boolean {
        return this.state.currentTickSamplePosition === this.state.samplesPerTick;
    }

    private _isStartofRow(): boolean {
        return this.state.currentTick === 0 && this.state.currentTickSamplePosition === 0;
    }

    private _isStartOfTick(): boolean {
        return this.state.currentTickSamplePosition === 0;
    }

    private _processEffects(effectProcessor: Function): void {
        this.channels.forEach(channel => {
            const channelEffect = channel.getEffect();
            if(channelEffect) {
                effectProcessor(this, this.state, channel);
            }
        });
    }

    private _setupAudioNodes(): void {
        // Create buffer used to store audio data
        this.buffer = appConstants.AUDIO_CONTEXT.createBuffer(2, appConstants.AUDIO_CONTEXT.sampleRate, appConstants.AUDIO_CONTEXT.sampleRate);

        // Create bufferSoureNode and set to looping so that the bufferSourceNode never stops
        this.bufferSourceNode = appConstants.AUDIO_CONTEXT.createBufferSource();
        this.bufferSourceNode.loop = true;

        // Create scriptProcessorNode and add function to allow the scriptProcessorNode to process audio data
        this.scriptProcessorNode = appConstants.AUDIO_CONTEXT.createScriptProcessor(undefined, 1, 2);
        this.scriptProcessorNode.onaudioprocess = this.onAudioProcess.bind(this);

        // Connect everything up ready to connect to audio context
        this.bufferSourceNode.buffer = this.buffer;
        this.bufferSourceNode.connect(this.scriptProcessorNode);
        // this.scriptProcessorNode.connect(appConstants.AUDIO_CONTEXT.destination);
    };

    private _setupChannels(channelCount: number): void {
        this.channels.length = 0;
        for(let i=0; i<channelCount; i++) {
            this.channels.push(new ProtrackerChannel(
                this.scriptProcessorNode.bufferSize,
                appConstants.AUDIO_CONTEXT.sampleRate,
                this.amigaClockSpeed
            ));
        }
    };
}
