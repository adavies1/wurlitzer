import * as protrackerConstants from './constants';
import * as appConstants from '../../constants';

import { Instruction } from './models/Instruction.interface';
import { Sample } from './models/Sample.interface';

import Player from "../Player";
import { ProtrackerChannel } from "./ProtrackerChannel";
import * as reader from "./ProtrackerReader";
import * as effects from './ProtrackerEffect';
import { mergeChannelsToOutput } from '../../utils';

export interface Song {
    channelCount:    number;
    patternCount:    number;
    patterns:        Instruction[][][];
    patternSequence: number[];
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
    currentTickSamplePosition:   number,
    currentTick:                 number,
    rowsPerPattern:              number,
    samplesPerTick:              number,
    speed:                       number,
    subtrack:                    number,
    ticksPerRow:                 number,
}

export class Protracker extends Player {
    amigaClockSpeed     : number                = protrackerConstants.AMIGA_CLOCK_SPEED_PAL;
    buffer              : AudioBuffer           = appConstants.AUDIO_CONTEXT.createBuffer(2, appConstants.AUDIO_CONTEXT.sampleRate, appConstants.AUDIO_CONTEXT.sampleRate);
    bufferSourceNode    : AudioBufferSourceNode = appConstants.AUDIO_CONTEXT.createBufferSource();
    channels            : ProtrackerChannel[]   = [];
    scriptProcessorNode : ScriptProcessorNode   = appConstants.AUDIO_CONTEXT.createScriptProcessor(undefined, 1, 2);
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
            samples:         reader.getSamples(fileData),
            signature:       reader.getSignature(fileData),
            songLength:      reader.getUsedPatternSequenceLength(fileData),
            songLoop:        reader.getSongLoopPatternSequenceIndex(fileData),
            title:           reader.getTitle(fileData),
        };

        // Create channels and audio nodes
        this._setupAudioNodes();
        this._createChannels(this.song.channelCount);

        // Set state ready to start playback
        this.reset();
    };


    /****************************
     *     Public functions     *
     ****************************/
    getChannels(): ProtrackerChannel[] {
        return this.channels;
    };

    getPlaybackState(): State {
        return this.state;
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
        return this.setSubtrack(this.state.subtrack + 1);
    };

    nextTick(): boolean {
        return this.setTick(this.state.currentTick + 1) || this.nextRow();
    };

    previousPattern(): boolean {
        return this.setPatternSequenceIndex(this.state.currentPatternSequenceIndex);
    };

    previousRow(): boolean {
        if(!this.setRowIndex(this.state.currentRowIndex - 1)) {
            return this.previousPattern() && this.setRowIndex(this.state.rowsPerPattern - 1);
        }
        return true;
    };

    previousSubtrack(): boolean {
        return this.setSubtrack(this.state.subtrack - 1);
    };

    previousTick(): boolean {
        if(!this.setTick(this.state.currentTick - 1)) {
            return this.previousRow() && this.setTick(this.state.ticksPerRow - 1);
        }
        return true;
    };

    pause(): void {
        this.bufferSourceNode.stop();
    };

    play(): void {
        this.bufferSourceNode.start();
    };

    reset(): void {
        this.state = {
            currentBufferSamplePosition: 0,
            currentPatternSequenceIndex: 0,
            currentRowIndex:             0,
            currentTickSamplePosition:   0,
            currentTick:                 0,
            rowsPerPattern:              0,
            samplesPerTick:              0,
            speed:                       0,
            subtrack:                    0,
            ticksPerRow:                 0,
        };

        this.channels.forEach(channel => {
            channel.reset();
        });
    };

    setAmigaClockSpeed(clockSpeed: protrackerConstants.AMIGA_CLOCK_SPEED): void {
        this.amigaClockSpeed = clockSpeed;
    };

    setPatternSequenceIndex(index: number): boolean {
        if(this.song.patternSequence[index]) {
            this.state.currentPatternSequenceIndex = index;
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
        if(tick < this.state.ticksPerRow) {
            this.state.currentTick = tick;
            this.state.currentBufferSamplePosition = 0;
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
        const samplesToGenerate = this._calculateNumberOfSamplesToGenerate();

        // If this is the start of a new row, assign instruction data to channels
        if(this.state.currentRowIndex === 0 && this.state.currentTick === 0 && this.state.currentTickSamplePosition === 0) {
            this.channels.forEach((channel, index) => {
                let instruction = this._getCurrentRow()[index];

                if(instruction.effect) {
                    channel.setEffect(instruction.effect);
                }
                if(instruction.period) {
                    channel.setPeriod(instruction.period);
                }
                if(instruction.sampleIndex) {
                    // A sampleIndex of 0 means no sample specified, which means that
                    // Effectively, the samples coming from the instructions are 1-based.
                    // We have to handle this as the sample array is 0-based.
                    channel.setSample(this.song.samples[instruction.sampleIndex - 1]);
                    channel.setFinetune(this.song.samples[instruction.sampleIndex - 1].fineTune);
                }
            });
        }

        // If this is the start of a tick, process effects for each channel
        if(this.state.currentTickSamplePosition === 0) {
            this.channels.forEach(channel => {
                if(channel.getEffect() !== null) {
                    effects.process(this.state, channel, channel.getEffect());
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
            mergeChannelsToOutput(event.outputBuffer, this.channels);
        }
    };


    /*****************************
     *     Private functions     *
     *****************************/
    private _calculateNumberOfSamplesToGenerate(): number {
        return Math.min(
            this.scriptProcessorNode.bufferSize,
            this.state.samplesPerTick - this.state.currentTickSamplePosition
        );
    };

    private _createChannels(channelCount: number): void {
        for(let i=0; i<channelCount; i++) {
            this.channels.push(new ProtrackerChannel(
                this.scriptProcessorNode.bufferSize,
                appConstants.AUDIO_CONTEXT.sampleRate,
                this.amigaClockSpeed
            ));
        }
    };

    private _getCurrentPattern(): Instruction[][] {
        return this.song.patterns[this.state.currentPatternSequenceIndex];
    };

    private _getCurrentRow(): Instruction[] {
        return this.song.patterns[this.state.currentPatternSequenceIndex][this.state.currentRowIndex];
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

    private _setupAudioNodes(): void {
        // Set bufferSoureNode to looping so that the bufferSourceNode never stops
        this.bufferSourceNode.loop = true;

        // Add function to allow the scriptProcessorNode to process audio data
        this.scriptProcessorNode.onaudioprocess = this.onAudioProcess.bind(this);

        // Connect everything up
        this.bufferSourceNode.buffer = this.buffer;
        this.bufferSourceNode.connect(this.scriptProcessorNode);
        //this.scriptProcessorNode.connect(appConstants.AUDIO_CONTEXT.destination);
    };
}
