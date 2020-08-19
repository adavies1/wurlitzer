import * as constants from '../../constants';

export default abstract class Player {
    audioContext: AudioContext;
    status: constants.PlayerStatus = constants.PlayerStatus.STOPPED;

    constructor(audioContext: AudioContext) {
        this.audioContext = audioContext;
    }

    abstract getPlaybackStatus(): constants.PlayerStatus;
    abstract hasSubtracks(): boolean;
    abstract pause(): void;
    abstract play(): void;
    abstract previousSubtrack(): boolean;
    abstract nextSubtrack(): boolean;
    abstract reset(): void;
    abstract setSubtrack(index: number): boolean;
    abstract skipToPosition(newPosition: number): boolean;

    stop() {
        this.pause();
        this.reset();
        this.status = constants.PlayerStatus.STOPPED;
    };
};
