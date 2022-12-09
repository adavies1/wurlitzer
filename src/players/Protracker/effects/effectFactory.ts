import { EFFECT_CODES } from "../constants";
import { EffectCode } from "../models/EffectCode.interface";

import arpeggioEffect from "./arpeggioEffect/arpeggioEffect";
import finePortamentoDownEffect from "./finePortamentoDownEffect/finePortamentoDownEffect";
import finePortamentoUpEffect from "./finePortamentoUpEffect/finePortamentoUpEffect";
import portamentoDownEffect from "./portamentoDownEffect/portamentoDownEffect";
import portamentoUpEffect from "./portamentoUpEffect/portamentoUpEffect";
import vibratoEffect from "./vibratoEffect/vibratoEffect";
import volumeSlideEffect from "./volumeSlideEffect/volumeSlideEffect";
import fineVolumeSlideUpEffect from "./fineVolumeSlideUpEffect/fineVolumeSlideUpEffect";
import fineVolumeSlideDownEffect from "./fineVolumeSlideDownEffect/fineVolumeSlideDownEffect";
import tremoloEffect from "./tremoloEffect/tremoloEffect";
import positionJumpEffect from "./positionJumpEffect/positionJumpEffect";
import patternBreakEffect from "./patternBreakEffect/patternBreakEffect";
import patternLoopEffect from "./patternLoopEffect/patternLoopEffect";
import noteDelayEffect from "./noteDelayEffect/noteDelayEffect";
import noteCutEffect from "./noteCutEffect/noteCutEffect";
import retriggerNoteEffect from "./retriggerNoteEffect/retriggerNoteEffect";
import setSampleOffsetEffect from "./setSampleOffsetEffect/setSampleOffsetEffect";
import setVolumeEffect from "./setVolumeEffect/setVolumeEffect";
import setVibratoWaveformEffect from "./setVibratoWaveformEffect/setVibratoWaveformEffect";
import setTemoloWaveformEffect from "./setTremoloWaveformEffect/setTremoloWaveformEffect";
import setFineTuneEffect from "./setFineTuneEffect/setFineTuneEffect";
import setSpeedEffect from "./setSpeedEffect/setSpeedEffect";
import tonePortamentoEffect from "./tonePortamentoEffect/tonePortamentoEffect";
import volumeSlideVibratoEffect from "./volumeSlideVibratoEffect/volumeSlideVibratoEffect";
import volumeSlideTonePortamentoEffect from "./volumeSlideTonePortamentoEffect/volumeSlideTonePortamentoEffect";
import patternDelayEffect from "./patternDelayEffect/patternDelayEffect";

/**
 * Will return a Protracker<Effect>Effect class instance which can be used to process the given effect
 * @param effectCode - The effect code that we want to be able to process
 */
export function effectFactory(effectCode?: EffectCode) {
    if(!effectCode) return undefined;

    const code = effectCode.code === 14 ? `${effectCode.code}-${effectCode.px}` : `${effectCode.code}`;

    switch(code) {
        case EFFECT_CODES.ARPEGGIO:
            return arpeggioEffect(effectCode.px, effectCode.py);
        case EFFECT_CODES.PORTAMENTO_DOWN:
            return portamentoDownEffect(effectCode.p);
        case EFFECT_CODES.PORTAMENTO_UP:
            return portamentoUpEffect(effectCode.p);
        case EFFECT_CODES.TONE_PORTAMENTO:
            return tonePortamentoEffect(effectCode.p);
        case EFFECT_CODES.VIBRATO:
            return vibratoEffect(effectCode.px, effectCode.py);
        case EFFECT_CODES.VOLUME_SLIDE_TONE_PORTAMENTO:
            return volumeSlideTonePortamentoEffect(effectCode.px, effectCode.py);
        case EFFECT_CODES.VOLUME_SLIDE_VIBRATO:
            return volumeSlideVibratoEffect(effectCode.px, effectCode.py);
        case EFFECT_CODES.TREMOLO:
            return tremoloEffect(effectCode.px, effectCode.py);
        case EFFECT_CODES.SET_SAMPLE_OFFSET:
            return setSampleOffsetEffect(effectCode.p);
        case EFFECT_CODES.VOLUME_SLIDE:
            return volumeSlideEffect(effectCode.px, effectCode.py)
        case EFFECT_CODES.POSITION_JUMP:
            return positionJumpEffect(effectCode.p);
        case EFFECT_CODES.SET_VOLUME:
            return setVolumeEffect(effectCode.p);
        case EFFECT_CODES.PATTERN_BREAK:
            return patternBreakEffect(effectCode.px, effectCode.py);

        // extended codes (E0-EF)
        case EFFECT_CODES.FINE_PORTAMENTO_UP:
            return finePortamentoUpEffect(effectCode.py)
        case EFFECT_CODES.FINE_PORTAMENTO_DOWN:
            return finePortamentoDownEffect(effectCode.py)
        case EFFECT_CODES.SET_VIBRATO_WAVEFORM:
            return setVibratoWaveformEffect(effectCode.py);
        case EFFECT_CODES.SET_FINE_TUNE:
            return setFineTuneEffect(effectCode.py);
        case EFFECT_CODES.PATTERN_LOOP:
            return patternLoopEffect(effectCode.py);
        case EFFECT_CODES.SET_TREMOLO_WAVEFORM:
            return setTemoloWaveformEffect(effectCode.py);
        case EFFECT_CODES.RETRIGGER_NOTE:
            return retriggerNoteEffect(effectCode.py);
        case EFFECT_CODES.FINE_VOLUME_SLIDE_UP:
            return fineVolumeSlideUpEffect(effectCode.py);
        case EFFECT_CODES.FINE_VOLUME_SLIDE_DOWN:
            return fineVolumeSlideDownEffect(effectCode.py);
        case EFFECT_CODES.NOTE_CUT:
            return noteCutEffect(effectCode.py);
        case EFFECT_CODES.NOTE_DELAY:
            return noteDelayEffect(effectCode.py);
        case EFFECT_CODES.PATTERN_DELAY:
            return patternDelayEffect(effectCode.py);

        case EFFECT_CODES.SET_SPEED:
            return setSpeedEffect(effectCode.p);
    }
}

export default effectFactory;