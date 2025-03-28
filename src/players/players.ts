import { getInitOptions as getProtrackerInitOptions } from '../players/Protracker/ProtrackerReader';
import { PlayerInitInfo } from './models/PlayerInitInfo.interface';
import { PlayerNames } from './constants';

const players: PlayerInitInfo[] = [
    {
        name: PlayerNames.PROTRACKER,
        getInitOptions: getProtrackerInitOptions,
        options: {},
        path: process.env.PUBLIC_URL + '/players/protracker.js'
    }
];

export default players;