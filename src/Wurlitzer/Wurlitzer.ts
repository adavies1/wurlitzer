import * as utils from '../utils';
import { loadFile } from '../utils';
import { addAmigaMixer, getFilePlayer } from './utils';
import players from '../players/players';

export class Wurlitzer {
    audioContext: AudioContext;
    extraMessageHandler: (event: any) => void;
    fileData: ArrayBuffer | undefined;
    mixer: ChannelMergerNode | undefined;
    player: AudioWorkletNode | undefined;
    connected: boolean = false;
    status: 'not-ready' | 'loading' | 'stopped' | 'ready' | 'loading' = 'not-ready';

    constructor(audioContext?: AudioContext, messageHandler?: (event: any) => void) {
        this.audioContext = audioContext || utils.createAudioContext();
        this.extraMessageHandler = messageHandler || function(event) {};
    }

    getInfo = () => {
        this.player && this.player.port.postMessage({cmd: 'getInfo'});
    }

    async load(source: string | File) {
        const fileData = await loadFile(source);
        const player = await getFilePlayer(players, fileData, this.audioContext);

        this.stop();
        this.fileData = fileData;
        this.player = player;
        this.player.port.onmessage = this.onMessage;
        this.mixer = addAmigaMixer(this.audioContext, this.player);
        this.status = 'ready';
    }

    onMessage = (event: any) => {
        if(event.data.message === 'ended') {
            console.info('[Wurlitzer] - Song has ended');
            this.stop();
        }
        this.extraMessageHandler(event);
    }

    pause() {
        if(this.player && this.status === 'ready') {
            this._disconnect();
            this.player.port.postMessage({cmd: 'pause'});
        }
    }

    async play() {
        if(this.fileData && this.status === 'stopped') {
            this.player = await getFilePlayer(players, this.fileData, this.audioContext);
            this.player.port.onmessage = this.onMessage;
            this.mixer = addAmigaMixer(this.audioContext, this.player);
            this.status = 'ready';
        }

        if(this.player && this.status === 'ready') {
            this._connect();
            this.player.port.postMessage({cmd: 'play'});
        }
    }

    previousSubtrack() {
        this.player && this.player.port.postMessage({cmd: 'previousSubtrack'});
    }

    nextSubtrack() {
        this.player && this.player.port.postMessage({cmd: 'nextSubtrack'});
    }

    reset() {
        this.player && this.player.port.postMessage({cmd: 'reset'});
    }

    setSubtrack(index: number) {
        this.player && this.player.port.postMessage({cmd: 'setSubtrack', data: index});
    }

    skipToPosition(newPosition: number) {
        this.player && this.player.port.postMessage({cmd: 'skipToPosition', data: newPosition});
    }

    stop() {
        if(this.player && this.status === 'ready') {
            this._disconnect();
            this.player.port.postMessage({cmd: 'stop'});
            this.status = 'stopped';
        }
    }

    private _connect() {
        if(this.mixer && !this.connected) {
            this.mixer.connect(this.audioContext.destination);
            this.connected = true;
        }
    }

    private _disconnect() {
        if(this.mixer && this.connected) {
            this.mixer.disconnect();
            this.connected = false;
        }
    }
}

export default Wurlitzer;