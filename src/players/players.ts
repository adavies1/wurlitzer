import { getInitOptions as getProtrackerInitOptions } from '../players/Protracker/ProtrackerReader';

export interface PlayerInitInfo {
    name: string,
    getInitOptions: (fileData: ArrayBuffer) => AudioWorkletNodeOptions,
    options: AudioWorkletNodeOptions,
    path: string
}

const players:PlayerInitInfo[] = [
    {
        name: 'protracker',
        getInitOptions: getProtrackerInitOptions,
        options: {},
        path: '/dist/players/protracker.bundle.js'
    }
];

export default players;