import { getInitOptions as getProtrackerInitOptions } from './Protracker/init';
import { getInitOptions as getQuartetInitOptions } from './Quartet/init';
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