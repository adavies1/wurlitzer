import load, { MusicPlayer } from './MusicPlayer';

let player:MusicPlayer;

const loadButton = document.getElementById('loadButton');
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const stopButton = document.getElementById('stopButton');

loadButton.addEventListener('click', () => {
    load('test/unit/resources/Skid_Row2.mod')
    .then(musicPlayer => {
        console.log('ok!', musicPlayer);
        player = musicPlayer;
        loadButton.setAttribute('disabled', 'true');
        playButton.removeAttribute('disabled');
        pauseButton.removeAttribute('disabled');
        stopButton.removeAttribute('disabled');
    })
    .catch(err => {
        console.log('hmm...', err);
    });
});
playButton.addEventListener('click', () => {
    player.play();
});
pauseButton.addEventListener('click', () => {
    player.pause();
});
stopButton.addEventListener('click', () => {
    player.stop();
});

