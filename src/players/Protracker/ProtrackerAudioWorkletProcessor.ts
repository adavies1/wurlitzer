import { PlayerAudioWorkletProcessor } from '../Player/PlayerAudioWorkletProcessor';
import { PlayerNames } from '../constants';
import Protracker from './Protracker';

class ProtrackerAudioWorkletProcessor extends PlayerAudioWorkletProcessor {
    constructor(config: AudioWorkletNodeOptions = {}) {
        super(config, Protracker);
    }
}

registerProcessor(PlayerNames.PROTRACKER, ProtrackerAudioWorkletProcessor);