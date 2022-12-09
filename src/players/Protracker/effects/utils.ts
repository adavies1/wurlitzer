import { EFFECT_CODES, WAVE_TYPES } from "../constants";
import { EffectCode } from "../models/EffectCode.interface";
import ProtrackerOscillator from "../ProtrackerOscillator";

export function isTonePortamento(effect: EffectCode | undefined) {
    if (!effect) return false;
    const code = effect.code === 14 ? `${effect.code}-${effect.px}` : `${effect.code}`;
    return code === EFFECT_CODES.TONE_PORTAMENTO || code === EFFECT_CODES.VOLUME_SLIDE_TONE_PORTAMENTO;
}

export function setOscillatorWaveform(oscillator: ProtrackerOscillator, param: number) {
    const typeCode = param >= 4 ? param - 4 : param;
    const retrigger = param < 4;
    const generator = WAVE_TYPES[typeCode];

    oscillator.setWaveGenerator(generator);
    oscillator.setRetrigger(retrigger);
};