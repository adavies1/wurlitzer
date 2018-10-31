import { use, expect } from 'chai';
import { Protracker }  from '../../../../../src/players/Protracker/Protracker';

import * as testConstants from '../../../resources/constants';
import * as utils from '../../../../../src/utils';

describe('Protracker tests', () => {
    let protracker: Protracker;

    before(() => {
        return utils.loadFileFromUrl(testConstants.MOD_FILE_URL)
        .then((data) => {
            protracker = new Protracker(data);
        });
    });

    it('Should create a protracker instance', () => {
        expect(protracker instanceof Protracker);
    })
});
