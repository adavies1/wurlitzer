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
    samplesPerTick:              number,
    speed:                       number, // A.K.A ticks-per-row
    tempo:                       number, // A.K.A beats-per-minue (BPM)
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
            rowsPerPattern:  reader.getRowsPerPattern(fileData),
            samples:         reader.getSamples(fileData),
            signature:       reader.getSignature(fileData),
            songLength:      reader.getUsedPatternSequenceLength(fileData),
            songLoop:        reader.getSongLoopPatternSequenceIndex(fileData),
            title:           reader.getTitle(fileData),
        };

        // Create channels and audio nodes
        this._setupAudioNodes();
        this._setupChannels(this.song.channelCount);

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
        return this.state
    };

    getPlaybackStatus(): appConstants.PlayerStatus {
        return this.status;
    }

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
            this.status = appConstants.PlayerStatus.PAUSED;
            this.bufferSourceNode.stop();
            return true;
        }
        return false;
    };

    play(): boolean {
        this.bufferSourceNode.start();
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
            currentSubtrack:             0,
            currentTickSamplePosition:   0,
            currentTick:                 0,
            rowsPerBeat:                 4,
            samplesPerTick:              0,
            speed:                       6,
            tempo:                       125,
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
        if(tick < this.state.speed && tick >= 0) {
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

    private _getCurrentPattern(): Instruction[][] {
        return this.song.patterns[this.song.patternSequence[this.state.currentPatternSequenceIndex]];
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

    private _setupChannels(channelCount: number): void {
        for(let i=0; i<channelCount; i++) {
            this.channels.push(new ProtrackerChannel(
                this.scriptProcessorNode.bufferSize,
                appConstants.AUDIO_CONTEXT.sampleRate,
                this.amigaClockSpeed
            ));
        }
    };
}