import { AUDIO_CONTEXT } from './constants';
import * as utils from './utils';

import Player from './players/Player';
import { Protracker } from './players/Protracker/Protracker';

// Constants
const players = [
    Protracker
]

// Variables
export let currentPlayer: Protracker;

// Public functions
export function load(source: string | File): Promise<Player> {
    return (typeof source === 'string' ? utils.loadFileFromUrl(source) : utils.loadFileFromDisk(source))
    .then(fileData => {
        let fileCanBePlayed = false;

        players.forEach(player => {
            if(player.prototype.isFileSupported(fileData)) {
                try {
                    currentPlayer = new player(fileData);
                    fileCanBePlayed = true;
                }
                catch(e) {
                    // We get here if the player failed to load the song, continue to try other players
                }
            }
        });

        if(!fileCanBePlayed) {
            throw new Error('This file is not supported');
        }
        else {
            return currentPlayer;
        }
    })
};
