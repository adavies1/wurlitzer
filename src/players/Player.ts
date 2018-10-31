import * as constants from '../constants';

export default abstract class Player {
    status: constants.PlayerState = constants.PlayerState.STOPPED;

    abstract hasSubtracks(): boolean;
    abstract isFileSupported(fileData: ArrayBuffer): boolean;
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
        this.status = constants.PlayerState.STOPPED;
    };
};
