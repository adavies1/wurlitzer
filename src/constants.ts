export const AUDIO_CONTEXT: AudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

export enum PlayerState {
    STOPPED = 'STOPPED',
    PAUSED = 'PAUSED',
    PLAYING = 'PLAYING'
}
