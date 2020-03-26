import { EFFECT_CODES } from './constants';

import { Protracker } from './Protracker';
import { ProtrackerChannel } from './ProtrackerChannel';
import { State } from './Protracker';

export function onRowEnd(player: Protracker, state: State, channel: ProtrackerChannel) {
    const effectCode = channel.getEffect();
    if(!effectCode) return;

    const code = effectCode.code === 14 ? `${effectCode.code}-${effectCode.px}` : `${effectCode.code}`;

    switch(code) {
        case EFFECT_CODES.POSITION_JUMP:
            player.setPatternSequenceIndex(effectCode.p, true);
            break;
    }
}

export function onTickStart(player: Protracker, state: State, channel: ProtrackerChannel) {
    const effectCode = channel.getEffect();
    if(!effectCode) return;

    const instruction = channel.getInstruction();
    const code = effectCode.code === 14 ? `${effectCode.code}-${effectCode.px}` : `${effectCode.code}`;

    // Codes that only trigger at the start of a row
    if(state.currentTick === 0) {
        switch(code) {
            case EFFECT_CODES.SET_SAMPLE_OFFSET:
                channel.setSamplePosition(256 * effectCode.p);
                break;
            case EFFECT_CODES.SET_VOLUME:
                channel.setVolume(effectCode.p);
                break;
            case EFFECT_CODES.PATTERN_BREAK:
                player.nextPattern();
                player.setRowIndex(effectCode.p);
                break;
            case EFFECT_CODES.SET_SPEED:
                if(effectCode.p > 31) {
                    state.tempo = effectCode.p * state.rowsPerBeat;
                } else {
                    state.speed = effectCode.py;
                }
                break;
        }
    }

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
                channel.setVolume(Math.min(channel.getVolume() + effectCode.px - effectCode.py, 64));
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
                channel.setPeriod(channel.getOriginalPeriod() / Math.pow(2, effectCode.px / 12));
                break;
            }
            if (state.currentTick % 3 === 2) {
                channel.setPeriod(channel.getOriginalPeriod() / Math.pow(2, effectCode.py / 12));
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
    }
};
