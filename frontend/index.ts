import { Wurlitzer } from '../src';

let player:Wurlitzer;

const loadButtons = document.querySelectorAll('.loadButton');
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const stopButton = document.getElementById('stopButton');

function loadSong(event: Event): void {
    if(event.target instanceof Element) {
        const src = event.target.getAttribute('data-src');

        if(src) {
            player = player ? player : new Wurlitzer();
            player.load(src)
                .then(() => {
                    playButton && playButton.removeAttribute('disabled');
                    pauseButton && pauseButton.removeAttribute('disabled');
                    stopButton && stopButton.removeAttribute('disabled');
                })
                .catch((err:Error) => {
                    console.log('hmm...', err);
                });
        }
    }
};

loadButtons.forEach(button => button && button.addEventListener('click', loadSong));

playButton && playButton.addEventListener('click', () => {
    player.play();
});
pauseButton && pauseButton.addEventListener('click', () => {
    player.pause();
});
stopButton && stopButton.addEventListener('click', () => {
    player.stop();
});

