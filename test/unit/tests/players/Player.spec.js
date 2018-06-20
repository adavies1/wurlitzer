import { use, expect } from 'chai';
import * as utils from '../../../../src/utils';
import Player from '../../../../src/players/Player';

describe('Player tests', function() {
    let player;

    before(function() {
        player = new Player(null, null);
    });

    it('Should return a public API with specific functions / properties', function() {
        expect(Object.keys(player).sort()).to.eql([
            'api',
            'audioContext',
            'song',
            'state',
        ]);
    });

    describe('hasSubtracks tests', () => {
        it('Should return false', () => {
            expect(player.hasSubtracks()).to.equal(false);
        });
    });

    describe('isFileSupported tests', () => {
        it('Should return false', () => {
            expect(player.isFileSupported()).to.equal(false);
        });
    });
});