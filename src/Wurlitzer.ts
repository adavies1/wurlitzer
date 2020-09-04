import players, { PlayerInitInfo } from './players/players';
import * as utils from './utils';
import { loadFile } from './utils';

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
        const player = await loadPlayer(fileData, this.audioContext);

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
            this.player = await loadPlayer(this.fileData, this.audioContext);
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


// Utility functions
export function addAmigaMixer(audioContext: AudioContext, player: AudioWorkletNode): ChannelMergerNode {
    const mixer = new ChannelMergerNode(audioContext, { numberOfInputs: 2 });

    // If song has 4 channels, mimick amiga left/right split (LRRL)
    if(player.numberOfOutputs === 4) {
        [0,3].forEach(index => player.connect(mixer, index, 0));
        [1,2].forEach(index => player.connect(mixer, index, 1));
    }
    // Otherwise, just assume the channels alternate (LRLRLR...)
    else {
        [...new Array(player.numberOfOutputs)]
            .map((item, index) => index)
            .filter(index => index % 2 === 0)
            .forEach(index => player.connect(mixer, index, 0));

        [...new Array(player.numberOfOutputs)]
            .map((item, index) => index)
            .filter(index => index % 2 !== 0)
            .forEach(index => player.connect(mixer, index, 1));
    }

    return mixer;
}

export async function loadPlayer(fileData: ArrayBuffer, audioContext: AudioContext): Promise<AudioWorkletNode> {
    let requiredPlayer:PlayerInitInfo | undefined;

    players.forEach(player => {
        try {
            requiredPlayer = {...player, options: player.getInitOptions(fileData)}
        }
        catch(e) {
            // We get here if the player does not support the song (or something went wrong), continue to try other players
        }
    });

    if(!requiredPlayer) {
        throw new Error('This file is not supported');
    }

    try {
        return new AudioWorkletNode(audioContext, requiredPlayer.name, requiredPlayer.options);
    }
    catch(e) {
        await audioContext.audioWorklet.addModule(requiredPlayer.path);
        return new AudioWorkletNode(audioContext, requiredPlayer.name, requiredPlayer.options);
    }
}

export default Wurlitzer;