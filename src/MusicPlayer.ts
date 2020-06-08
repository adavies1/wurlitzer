import * as utils from './utils';
import { PlayerInitInfo } from './models';

import { getInitOptions as getProtrackerInitOptions } from './players/Protracker/ProtrackerReader';

export const players:PlayerInitInfo[] = [
    {
        name: 'protracker',
        getInitOptions: getProtrackerInitOptions,
        options: undefined,
        path: '/dist/protracker.bundle.js'
    }
]

export default class MusicPlayer {
    audioContext: AudioContext;
    fileData: ArrayBuffer;
    mixer: ChannelMergerNode;
    player: AudioWorkletNode;
    connected: boolean = false;
    ready: boolean = false;

    constructor() {
        this.audioContext = utils.createAudioContext();
    }

    async load(source: string | File) {
        const fileData = await _loadMusicFile(source);
        const player = await _loadPlayer(fileData, this.audioContext);
        this.stop();
        this.player = player;
        this.fileData = fileData;
        this.mixer = _addAmigaMixer(this.audioContext, player);
        this.ready = true;
    }

    pause() {
        if(this.ready) {
            this._disconnect();
            this.player.port.postMessage({cmd: 'pause'});
        }
    }

    play() {
        if(this.ready) {
            this._connect();
            this.player.port.postMessage({cmd: 'play'});
        }
    }

    previousSubtrack() {
        this.player.port.postMessage({cmd: 'previousSubtrack'});
    }

    nextSubtrack() {
        this.player.port.postMessage({cmd: 'nextSubtrack'});
    }

    reset() {
        this.player.port.postMessage({cmd: 'reset'});
    }

    setSubtrack(index: number) {
        this.player.port.postMessage({cmd: 'setSubtrack', data: index});
    }

    skipToPosition(newPosition: number) {
        this.player.port.postMessage({cmd: 'skipToPosition', data: newPosition});
    }

    stop() {
        if(this.ready) {
            this._disconnect();
            this.player.port.postMessage({cmd: 'stop'});
        }
    }

    private _connect() {
        if(!this.connected) {
            this.mixer.connect(this.audioContext.destination);
            this.connected = true;
        }
    }

    private _disconnect() {
        if(this.connected) {
            this.mixer.disconnect();
            this.connected = false;
        }
    }
}


// Utility functions
export function _addAmigaMixer(audioContext: AudioContext, player: AudioWorkletNode): ChannelMergerNode {
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

export async function _loadMusicFile(source: string | File): Promise<ArrayBuffer> {
    return (typeof source === 'string' ? utils.loadFileFromUrl(source) : utils.loadFileFromDisk(source))
}

export async function _loadPlayer(fileData: ArrayBuffer, audioContext: AudioContext): Promise<AudioWorkletNode> {
    let requiredPlayer:PlayerInitInfo = undefined;

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