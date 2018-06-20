import {use, expect} from 'chai';
import Protracker from '../../../../../src/players/Protracker/Protracker';
import * as utils from '../../../../../src/utils';

describe('Protracker tests', () => {
    let AudioContext = window.AudioContext || window.webkitAudioContext;
    let modFileData;
    let protracker;

    before(() => {
        return utils.loadFileFromUrl(window.globals.modFileUrl)
        .then((data) => {
            modFileData = data;
            protracker = new Protracker(new AudioContext(), modFileData);
        });
    });

    it('Should return a public API with specific functions', () => {
        expect(Object.keys(protracker).sort()).to.eql([
            "getChannels",
            "getPlaybackState",
            "getSong",
            "goToSubtrack",
            "hasSubtracks",
            "isFileSupported",
            "nextPattern",
            "nextRow",
            "nextSubtrack",
            "nextTick",
            "onAudioProcess",
            "pause",
            "play",
            "previousPattern",
            "previousRow",
            "previousSubtrack",
            "previousTick",
            "reset",
            "setAmigaClockSpeed",
            "setPattern",
            "setRow",
            "setSubtrack",
            "setTick",
            "skipToPosition",
            "stop"
        ]);
    });
});