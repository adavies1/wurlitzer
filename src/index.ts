import load, { MusicPlayer } from './MusicPlayer';

let player:MusicPlayer;

const loadButtons = document.querySelectorAll('.loadButton');
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const stopButton = document.getElementById('stopButton');

function loadSong(event: MouseEvent): void {
    const loadFunc = typeof player === 'undefined' ? load : player.load;

    if(event.target instanceof Element) {
        if(typeof player === 'undefined') {
            load(event.target.getAttribute('data-src'))
                .then(musicPlayer => {
                    player = musicPlayer;
                    playButton.removeAttribute('disabled');
                    pauseButton.removeAttribute('disabled');
                    stopButton.removeAttribute('disabled');
                })
                .catch(err => {
                    console.log('hmm...', err);
                });
        }
        else {
            player.load(event.target.getAttribute('data-src'))
                .catch(err => {
                    console.log('hmm...', err);
                });
        }
    }
};

loadButtons.forEach(button => button.addEventListener('click', loadSong));

playButton.addEventListener('click', () => {
    player.play();
});
pauseButton.addEventListener('click', () => {
    player.pause();
});
stopButton.addEventListener('click', () => {
    player.stop();
});

