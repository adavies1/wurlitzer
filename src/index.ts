import load from './MusicPlayer';

load('test/unit/resources/Skid_Row2.mod')
    .then(player => {
        console.log('ok!', player);
        document.getElementById('playButton').addEventListener('click', () => {
            player.play();
        });
        document.getElementById('pauseButton').addEventListener('click', () => {
            player.pause();
        });
        document.getElementById('stopButton').addEventListener('click', () => {
            player.stop();
        });
    })
    .catch(err => {
        console.log('hmm...', err);
    });
