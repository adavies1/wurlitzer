import * as constants from '../../constants';
import { PlayerInfo } from './models/PlayerInfo.interface';

export abstract class Player {
    audioContext: AudioContext;
    fileData: ArrayBuffer;
    status: constants.PlayerStatus = constants.PlayerStatus.STOPPED;

    constructor(audioContext: AudioContext, fileData: ArrayBuffer) {
        this.audioContext = audioContext;
        this.fileData = fileData;
    }

    abstract getInfo(): PlayerInfo;
    abstract getPlaybackStatus(): constants.PlayerStatus;
    abstract hasSubtracks(): boolean;
    abstract pause(): void;
    abstract play(): void;
    abstract previousSubtrack(): boolean;
    abstract nextSubtrack(): boolean;
    abstract onAudioProcess(channelBuffers: Float32Array[]): boolean;
    abstract reset(): void;
    abstract setSubtrack(index: number): boolean;
    abstract skipToPosition(newPosition: number): boolean;

    stop() {
        this.pause();
        this.reset();
        this.status = constants.PlayerStatus.STOPPED;
    };
};

export default Player;