import * as protrackerConstants from './constants';
import * as appConstants from '../../constants';

import { Instruction } from './models/Instruction.interface';

import { Player } from "../Player/Player";
import { ProtrackerChannel } from "./ProtrackerChannel/ProtrackerChannel";
import { ProtrackerInfo } from './models/ProtrackerInfo.interface';
import * as reader from "./ProtrackerReader";

import { isTonePortamento } from './effects/utils';

export type ProtrackerState = {
    currentBufferSamplePosition: number,
    currentPatternSequenceIndex: number,
    currentRowIndex:             number,
    currentSubtrack:             number,
    currentTickSamplePosition:   number,
    currentTick:                 number,
    patternDelay:                number; // In ticks
    patternLoopCount:            number,
    patternLoopRowIndex:         number,
    rowsPerBeat:                 number,
    samplesPerTick:              number, // 2500/bpm
    speed:                       number, // A.K.A ticks-per-row
    tempo:                       number, // A.K.A beats-per-minue (BPM).
}

export const defaultState = {
    currentBufferSamplePosition: 0,
    currentPatternSequenceIndex: 0,
    currentRowIndex:             0,
    currentSubtrack:             0,
    currentTickSamplePosition:   0,
    currentTick:                 0,
    patternDelay:                -1,
    patternLoopCount:            0,
    patternLoopRowIndex:         0,
    rowsPerBeat:                 4,
    samplesPerTick:              0,
    speed:                       6,
    tempo:                       125,
};

export class Protracker extends Player {
    amigaClockSpeed     : number                = protrackerConstants.AMIGA_CLOCK_SPEED_PAL;
    channels            : ProtrackerChannel[]   = [];
    song                : ProtrackerInfo;
    state               : ProtrackerState       = {...defaultState};

    constructor(audioContext: AudioContext, fileData: ArrayBuffer) {
        super(audioContext, fileData);

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

        this._setupChannels(this.song.channelCount);
        this.state.samplesPerTick = this._calculateSamplesPerTick();
    };


    // ****************************
    // *     Public functions     *
    // ****************************

    getChannels(): ProtrackerChannel[] {
        return this.channels;
    };

    getPatternDelay(): number {
        return this.state.patternDelay;
    }

    getPatternLoopCount(): number {
        return this.state.patternLoopCount;
    }

    getPatternLoopRowIndex(): number {
        return this.state.patternLoopRowIndex;
    }

    getPlaybackState(): ProtrackerState {
        return this.state
    };

    getPlaybackStatus(): appConstants.PlayerStatus {
        return this.status;
    };

    getRowPosition(): number {
        const currentSamples = (this.state.currentTick * this.state.samplesPerTick) + this.state.currentTickSamplePosition;
        return currentSamples / (this.state.speed * this.state.samplesPerTick);
    }

    getInfo(): ProtrackerInfo {
        return this.song;
    };

    getSongLoopIndex(): number | undefined {
        return this.song.songLoop;
    }

    hasSubtracks(): boolean {
        // TODO: Add subtrack support
        return false;
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
            return true;
        }
        return false;
    };

    play(): boolean {
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
        this.state = {...defaultState, currentSubtrack: this.state.currentSubtrack}
        this.channels.forEach(channel => channel.reset());
        this.state.samplesPerTick = this._calculateSamplesPerTick();
    };

    setAmigaClockSpeed(clockSpeed: protrackerConstants.AMIGA_CLOCK_SPEED): void {
        this.amigaClockSpeed = clockSpeed;
    };

    setPatternDelay(ticks: number): void {
        this.state.patternDelay = ticks;
    }

    setPatternLoopCount(count: number): void {
        this.state.patternLoopCount = count;
    }

    setPatternLoopRowIndex(index: number): void {
        this.state.patternLoopRowIndex = index;
    }

    setPatternSequenceIndex(index: number | undefined, zeroOnFail: boolean = false): boolean {
        if(typeof index !== 'undefined' && typeof this.song.patternSequence[index] !== 'undefined' && index <= this.song.songLength - 1) {
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
            this.setPatternLoopRowIndex(0);
            this.setTick(0);
            return true;
        }
        return false;
    };

    setSpeed(speed: number) {
        this.state.speed = speed;
    }

    setSubtrack(index: number): boolean {
        // TODO: Add subtrack support
        return false;
    };

    setTempo(tempo: number) {
        this.state.tempo = tempo;
        this.state.samplesPerTick = this._calculateSamplesPerTick();
    }

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


    // ***************************
    // *     Event functions     *
    // ***************************

    onAudioProcess(channelBuffers: Float32Array[]): boolean {
        let stillMoreToPlay = true;

        if (!this._isDelayed()) {
            if(this._isStartofRow()) {
                this._assignInstructionsToChannels(this._getCurrentRow());
                this._processEffects('onRowStart');
            }

            if(this._isStartOfTick()) {
                this._processEffects('onTickStart');
            }
        }

        this._fillBuffers(channelBuffers);

        if (!this._isDelayed() && this._isEndOfRow()) {
            this._processEffects('onRowEnd');
        }

        if(this._isEndOfTick()) {
            stillMoreToPlay = this._goToNextPosition();
        }

        if(stillMoreToPlay) {
            if(!this._isBufferFull(channelBuffers[0].length)) {
                stillMoreToPlay = this.onAudioProcess(channelBuffers);
            }
            else {
                this.state.currentBufferSamplePosition = 0;
            }
        } else {
            this.reset();
        }

        return stillMoreToPlay;
    };


    // *****************************
    // *     Private functions     *
    // *****************************

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

            if(instruction.period && (!isTonePortamento(instruction.effect))) {
                channel.resetFineTune();
                channel.setOriginalPeriod(instruction.period);
                channel.resetSample();
            }
        });
    }

    private _calculateNumberOfSamplesToGenerate(bufferSize: number): number {
        return Math.min(
            this.state.samplesPerTick - this.state.currentTickSamplePosition,
            bufferSize - this.state.currentBufferSamplePosition
        );
    };

    private _calculateSamplesPerTick(): number {
        const tickDurationMs = (2500 / this.state.tempo);
        return Math.round(this.audioContext.sampleRate * (tickDurationMs / 1000));
    }

    private _fillBuffers(channelBuffers: Float32Array[]): void {
        const samplesToGenerate = this._calculateNumberOfSamplesToGenerate(channelBuffers[0].length);

        this.channels.forEach((channel, index) => {
            channel.fillBuffer(channelBuffers[index], this.state.currentBufferSamplePosition, samplesToGenerate);
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
        let nextPosition;

        if(this._isDelayed()) {
            this.setPatternDelay(this.getPatternDelay() - 1);
            this.state.currentTickSamplePosition = 0;
            return true;
        }

        nextPosition = (
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

    private _isBufferFull(bufferSize: number): boolean {
        return this.state.currentBufferSamplePosition === bufferSize;
    }

    private _isDelayed(): boolean {
        return this._isEndOfRow() && this.getPatternDelay() >= 0;
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

    private _processEffects(eventName: string): void {
        this.channels.forEach((channel, index) => {
            const channelEffect = channel.getEffect();

            if(channelEffect) {
                switch(eventName) {
                    case 'onRowStart': {
                        channelEffect.onRowStart && channelEffect.onRowStart(this, channel);
                        break;
                    }
                    case 'onRowEnd': {
                        channelEffect.onRowEnd && channelEffect.onRowEnd(this, channel);
                        break;
                    }
                    case 'onTickStart': {
                        channelEffect.onTickStart && channelEffect.onTickStart(this, channel);
                        break;
                    }
                }
            }
        });
    }

    private _setupChannels(channelCount: number): void {
        this.channels.length = 0;
        for(let i=0; i<channelCount; i++) {
            this.channels.push(new ProtrackerChannel(i, this.audioContext.sampleRate, this.amigaClockSpeed));
        }
    };
}

export default Protracker;