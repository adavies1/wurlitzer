class MusicPlayer = {
    constructor() {
        this.audioContext = window.getAudioContext();
        this.currentPlayer = null;

        // Load all audio players
        this.players = [
            require('players/Protracker/Protracker');
        ]

        this.api = {
            getCurrentPlayer: this.getCurrentPlayer
        }
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
                return _loadFileFromUrl(source);
            }
            else {
                return _loadFileFromDisk(source);
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
    _loadFileFromDisk(source) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader;

            reader.on('load', fileData => {
                if(fileData) {
                    resolve(fileData);
                }
                else {
                    reject("EMPTY", "File is empty");
                }
            });
            reader.on('timeout', function() {
                reject("TIMEOUT", "Request timed out");
            });
            reader.on('abort', function() {
                reject('ABORT', "Request aborted");
            });

            reader.readAsArrayBuffer(source);
        })
    };

    _loadFileFromUrl(sourceUrl) {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();

            req.onreadystatechange = response => {
                if(response.reponse) {
                    resolve(response.response);
                }
                else {
                    reject("EMPTY", "File is empty");
                }
            }
            req.on('error', function() {
                reject("ERROR", "Network error");
            });
            req.on('timeout', function() {
                reject("TIMEOUT", "Request timed out");
            });
            req.on('abort', function() {
                reject('ABORT', "Request aborted");
            });

            req.responseType = 'arrayBuffer';
            req.open('GET', sourceUrl, true);
        });
    };
}

export MusicPlayer;