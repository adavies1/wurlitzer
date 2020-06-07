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

export class MusicPlayer {
    audioContext: AudioContext;
    fileData: ArrayBuffer;
    player: AudioWorkletNode;
    playerConnected: boolean = false;

    constructor(audioContext: AudioContext, player: AudioWorkletNode, fileData: ArrayBuffer) {
        this.audioContext = audioContext;
        this.player = player;
        this.fileData = fileData;
    }

    pause() {
        this.player.disconnect();
        this.playerConnected = false;
        this.player.port.postMessage({cmd: 'pause'});
    }
    play() {
        if(!this.playerConnected) {
            this.player.connect(this.audioContext.destination);
            this.playerConnected = true;
        }
        this.player.port.postMessage({cmd: 'play'});
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
        this.player.disconnect();
        this.playerConnected = false;
        this.player.port.postMessage({cmd: 'stop'});
    }
}


// Public functions
export default async function load(source: string | File): Promise<MusicPlayer> {
    const audioContext = utils.createAudioContext();
    const fileData = await _loadMusicFile(source);
    const player = await _loadPlayer(fileData, audioContext);
    return new MusicPlayer(audioContext, player, fileData);
};


// Private functions
async function _loadMusicFile(source: string | File): Promise<ArrayBuffer> {
    return (typeof source === 'string' ? utils.loadFileFromUrl(source) : utils.loadFileFromDisk(source))
}

async function _loadPlayer(fileData: ArrayBuffer, audioContext: AudioContext): Promise<AudioWorkletNode> {
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

    await audioContext.audioWorklet.addModule(requiredPlayer.path);
    return new AudioWorkletNode(audioContext, requiredPlayer.name, requiredPlayer.options);
}