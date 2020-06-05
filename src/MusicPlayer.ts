import { AUDIO_CONTEXT } from './constants';
import * as utils from './utils';
import { PlayerInitInfo } from './models';

import { getInitOptions as getProtrackerInitOptions } from './players/Protracker/ProtrackerReader';

export const players:PlayerInitInfo[] = [
    {
        name: 'protracker',
        getInitOptions: getProtrackerInitOptions,
        options: undefined,
        path: '/dist/protracker.js'
    }
]

export class MusicPlayer {

}


// Public functions
export default async function load(source: string | File): Promise<MusicPlayer> {
    const fileData = await _loadMusicFile(source);
    const player = await _loadPlayer(fileData);
    return new MusicPlayer();
};


// Private functions
async function _loadMusicFile(source: string | File): Promise<ArrayBuffer> {
    return (typeof source === 'string' ? utils.loadFileFromUrl(source) : utils.loadFileFromDisk(source))
}

async function _loadPlayer(fileData: ArrayBuffer): Promise<AudioWorkletNode> {
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

    await AUDIO_CONTEXT.audioWorklet.addModule(requiredPlayer.path);
    return new AudioWorkletNode(AUDIO_CONTEXT, requiredPlayer.name, requiredPlayer.options);
}