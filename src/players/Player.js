import ExtendedClass from '../ExtendedClass';

export default class Player extends ExtendedClass {
    constructor(audioContext, fileData) {
        super(audioContext, fileData);

        this.audioContext = audioContext;

        this.song = {
            hasSubtracks: false,
            isSkippable:  false
        };

        this.state = {
            currentSubtrack: 0,
            status: 'STOPPED' // Can be 'STOPPED', 'PAUSED' or 'PLAYING'
        };

        // this.api = {
        //     // goToSubtrack:     this.goToSubtrack.bind(this),
        //     // nextSubtrack:     this.nextSubtrack.bind(this),
        //     // pause:            this.pause.bind(this),
        //     // play:             this.play.bind(this),
        //     // previousSubtrack: this.previousSubtrack.bind(this),
        //     // reset:            this.reset.bind(this),
        //     // skipToPosition:   this.skipToPosition.bind(this),
        //     stop:             this.stop.bind(this)
        // };

        this.api = this._getPublicApi(this);
    };


    /****************************
     *     Public functions     *
     ****************************/
    goToSubtrack(index) {
        console.warn('Stub, you need to override this function');
    };

    hasSubtracks() {
        return this.song.hasSubtracks;
    };

    isFileSupported(fileData) {
        // Override this with logic to check if your player can play this file
        console.warn('Stub, you need to override this function');
        return false;
    };

    nextSubtrack() {
        this.goToSubtrack('next');
    };

    pause() {
        console.warn('Stub, you need to override this function');
    };

    play() {
        console.warn('Stub, you need to override this function');
    };

    previousSubtrack() {
        this.goToSubtrack('previous');
    };

    reset() {
        console.warn('Stub, you need to override this function');
    };

    skipToPosition(position) {
        console.warn('Stub, you need to override this function');
    };

    stop() {
        this.pause();
        this.reset();
        this.state.status = 'STOPPED';
    };


    /***************************
     *     Event functions     *
     ***************************/


    /*****************************
     *     Private functions     *
     *****************************/
}