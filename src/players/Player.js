class Player {
    constructor(audioContext, fileData) {
        this.audioContext = audioContext;

        this.song = {
            hasSubtracks: false,
            isSkippable:  false
        };

        this.state = {
            currentSubtrack: 0,
            status: 'STOPPED' // Can be 'STOPPED', 'PAUSED' or 'PLAYING'
        };

        this.api = {
            goToSubtrack:     this.goToSubtrack.bind(this),
            nextSubtrack:     this.nextSubtrack.bind(this),
            pause:            this.pause.bind(this),
            play:             this.play.bind(this),
            previousSubtrack: this.previousSubtrack.bind(this),
            reset:            this.reset.bind(this),
            skipToPosition:   this.skipToPosition.bind(this),
            stop:             this.stop.bind(this)
        };
    };


    /****************************
     *     Public functions     *
     ****************************/
    goToSubtrack(index) {
        // Stub, you need to override this
    };

    nextSubtrack() {
        this.goToSubtrack('next');
    };

    pause() {
        // Stub, you need to override this
    };

    play() {
        // Stub, you need to override this
    };

    previousSubtrack() {
        this.goToSubtrack('previous');
    }

    reset() {
        // Stub, you need to override this
    };

    skipToPosition(position) {
        // Stub, you need to override this
    };

    stop() {
        this.pause();
        this.reset();
    };


    /***************************
     *     Event functions     *
     ***************************/


    /*****************************
     *     Private functions     *
     *****************************/
}