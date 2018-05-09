import ExtendedClass from './ExtendedClass';
import * as utils from './utils';

// Players
import Protracker from './players/Protracker/Protracker';


export default class MusicPlayer extends ExtendedClass {
    constructor() {
        this.audioContext = window.getAudioContext();
        this.currentPlayer = null;

        // Create a list of players for looping later
        this.players = [
            Protracker
        ]

        this.api = this._getPublicApi();
    }

    /****************************
     *     Public functions     *
     ****************************/
    getCurrentPlayer() {
        return this.currentPlayer;
    };

    loadFile(source, type) {
        return (() => {
            if(type === 'url') {
                return utils.loadFileFromUrl(source);
            }
            else {
                return utils.loadFileFromDisk(source);
            }
        })()
        .then(fileData => {
            var fileCanBePlayed = false;

            this.players.forEach(player => {
                if(player.isFileSupported(fileData)) {
                    try {
                        this.currentPlayer = new player(audioContext, fileData);
                        fileCanBePlayed = true;
                    }
                    catch(e) {
                        // Player failed to load the song, continue to try other players
                    }
                }
            });

            if(!fileCanBePlayed) {
                throw new Error('This file is not supported');
            }
            else {
                return this.currentPlayer;
            }
        })
    };


    /****************************
     *     Private functions     *
     ****************************/

};