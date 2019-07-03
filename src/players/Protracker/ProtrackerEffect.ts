import { EffectCode } from './models/EffectCode.interface';
import { EFFECT_CODES } from './constants';

import { ProtrackerChannel } from './ProtrackerChannel';
import { State } from './Protracker';

export function process(state: State, channel: ProtrackerChannel, effectCode: EffectCode) {
    const code = effectCode.code === 14 ? `${effectCode.code}-${effectCode.px}` : `${effectCode.code}`;

    switch(code) {
        case EFFECT_CODES.SET_SPEED:
            if(effectCode.p > 31) {
                state.tempo = effectCode.p * state.rowsPerBeat;
            } else {
                state.speed = effectCode.py;
            }
            break;
    }
};
