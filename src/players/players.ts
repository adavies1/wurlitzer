import { getInitOptions as getProtrackerInitOptions } from '../readers/ProtrackerReader/utils';
import { getInitOptions as getQuartetInitOptions } from '../players/Quartet/reader/quartetReader';
import { PlayerInitInfo } from './models/PlayerInitInfo.interface';
import { PlayerNames } from './constants';

const players: PlayerInitInfo[] = [
    {
        name: PlayerNames.PROTRACKER,
        getInitOptions: getProtrackerInitOptions,
        options: {},
        path: process.env.PUBLIC_URL + '/players/protracker.js'
    },
    {
        name: PlayerNames.QUARTET,
        getInitOptions: getQuartetInitOptions,
        options: {},
        path: process.env.PUBLIC_URL + '/players/quartet.js'
    }
];

export default players;