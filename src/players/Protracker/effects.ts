import { EFFECT_CODES } from './constants';

import { Protracker } from './Protracker';
import { ProtrackerChannel } from './ProtrackerChannel';
import { State } from './Protracker';
import { EffectCode } from './models/EffectCode.interface';


export function isTonePortamento(effect: EffectCode) {
    if (!effect) return false;
    const code = effect.code === 14 ? `${effect.code}-${effect.px}` : `${effect.code}`;
    return code === EFFECT_CODES.TONE_PORTAMENTO || code === EFFECT_CODES.VOLUME_SLIDE_TONE_PORTAMENTO;
}

export function onRowEnd(player: Protracker, state: State, channel: ProtrackerChannel) {
    const effectCode = channel.getEffect();
    if(!effectCode) return;

    const code = effectCode.code === 14 ? `${effectCode.code}-${effectCode.px}` : `${effectCode.code}`;

    switch(code) {
        case EFFECT_CODES.POSITION_JUMP:
            player.setPatternSequenceIndex(effectCode.p, true);
            break;

        case EFFECT_CODES.PATTERN_BREAK:
            player.nextPattern();
            player.setRowIndex((10 * effectCode.p) + effectCode.py);
            break;

        case EFFECT_CODES.FINE_PORTAMENTO_UP:
            channel.setPeriod(channel.getPeriod() - effectCode.py);
            break;

        case EFFECT_CODES.FINE_PORTAMENTO_DOWN:
            channel.setPeriod(channel.getPeriod() + effectCode.py);
            break;

        case EFFECT_CODES.PATTERN_LOOP:
            if(effectCode.py === 0) {
                player.setPatternLoopRowIndex(player.getPlaybackState().currentRowIndex);
            }
            else {
                const loopCount = player.getPatternLoopCount() - 1;
                player.setPatternLoopCount(loopCount);

                if (loopCount < 0) {
                    player.setPatternLoopCount(effectCode.py);
                }

                if (loopCount !== 0) {
                    player.setRowIndex(player.getPatternLoopRowIndex());
                }
            }
            break;

        case EFFECT_CODES.FINE_VOLUME_SLIDE_UP:
            channel.setVolume(Math.min(channel.getVolume() + effectCode.py, 64));
            break;

        case EFFECT_CODES.FINE_VOLUME_SLIDE_DOWN:
            channel.setVolume(Math.max(channel.getVolume() - effectCode.py, 0));
            break;
    }
}

export function onRowStart(player: Protracker, state: State, channel: ProtrackerChannel) {
    const effectCode = channel.getEffect();
    if(!effectCode) return;

    const code = effectCode.code === 14 ? `${effectCode.code}-${effectCode.px}` : `${effectCode.code}`;

    switch(code) {
        case EFFECT_CODES.SET_SAMPLE_OFFSET:
            channel.setSamplePosition(256 * effectCode.p);
            break;

        case EFFECT_CODES.SET_VOLUME:
            channel.setVolume(effectCode.p);
            break;

        case EFFECT_CODES.SET_FINE_TUNE:
            if (channel.getInstruction().period !== 0) {
                const newFineTune = effectCode.py < 8 ? effectCode.py : -16 + effectCode.py;
                channel.setFineTune(newFineTune);
            }
            break;

        case EFFECT_CODES.SET_SPEED:
            if(effectCode.p > 31) {
                state.tempo = effectCode.p * state.rowsPerBeat;
            } else {
                state.speed = effectCode.p;
            }
            break;
    }
}

export function onTickStart(player: Protracker, state: State, channel: ProtrackerChannel) {
    const effectCode = channel.getEffect();
    if(!effectCode) return;

    const instruction = channel.getInstruction();
    const code = effectCode.code === 14 ? `${effectCode.code}-${effectCode.px}` : `${effectCode.code}`;

    // Codes that trigger on every tick except the first
    if(state.currentTick > 0) {
        switch(code) {
            case EFFECT_CODES.PORTAMENTO_UP:
                channel.setPeriod(channel.getPeriod() - effectCode.p);
                break;

            case EFFECT_CODES.PORTAMENTO_DOWN:
                channel.setPeriod(channel.getPeriod() + effectCode.p);
                break;

            case EFFECT_CODES.VOLUME_SLIDE:
            case EFFECT_CODES.VOLUME_SLIDE_TONE_PORTAMENTO:
            case EFFECT_CODES.VOLUME_SLIDE_VIBRATO:
                channel.setVolume(Math.max(Math.min(channel.getVolume() + effectCode.px - effectCode.py, 64), 0));
                break;
        }
    }

    // Codes that trigger on every tick
    switch(code) {
        case EFFECT_CODES.ARPEGGIO:
            if (state.currentTick % 3 === 0) {
                channel.resetPeriod();
                break;
            }
            if (state.currentTick % 3 === 1) {
                channel.setPeriod(channel.getFineTunedPeriod() / Math.pow(2, effectCode.px / 12));
                break;
            }
            if (state.currentTick % 3 === 2) {
                channel.setPeriod(channel.getFineTunedPeriod() / Math.pow(2, effectCode.py / 12));
                break;
            }

        case EFFECT_CODES.TONE_PORTAMENTO:
        case EFFECT_CODES.VOLUME_SLIDE_TONE_PORTAMENTO:
            if (code === EFFECT_CODES.TONE_PORTAMENTO && state.currentTick === 0) {
                if(effectCode.p > 0) channel.setSlideRate(effectCode.p);
                if(instruction.period) channel.setSlideTarget(instruction.period);
            }
            if (channel.getPeriod() > channel.getSlideTarget()) {
                channel.setPeriod(Math.max(channel.getPeriod() - channel.getSlideRate(), channel.getSlideTarget()));
            } else if(channel.getPeriod() < channel.getSlideTarget()) {
                channel.setPeriod(Math.min(channel.getPeriod() + channel.getSlideRate(), channel.getSlideTarget()));
            }
            break;

        case EFFECT_CODES.RETRIGGER_NOTE:
            if (state.currentTick % effectCode.py === 0) {
                channel.setSamplePosition(0);
            }
            break;

        case EFFECT_CODES.NOTE_CUT:
            if (state.currentTick === effectCode.py) {
                channel.setVolume(0);
            }
            break;

        case EFFECT_CODES.NOTE_DELAY:
            if (state.currentTick < effectCode.py) {
                channel.setSampleAsEnded();
            }
            if (state.currentTick === effectCode.py) {
                channel.resetSample();
            }
            break;
    }
};
