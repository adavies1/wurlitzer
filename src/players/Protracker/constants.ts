import { WaveType } from "./models/WaveType.interface";

export const AMIGA_CLOCK_SPEED_NTSC = 7159090.5;
export const AMIGA_CLOCK_SPEED_PAL = 7093789.2;

export enum AMIGA_CLOCK_SPEED {
    NTSC = AMIGA_CLOCK_SPEED_NTSC,
    PAL  = AMIGA_CLOCK_SPEED_PAL
}

export const EFFECT_CODES = {
    ARPEGGIO:                     '0',           // √
    PORTAMENTO_UP:                '1',           // √
    PORTAMENTO_DOWN:              '2',           // √
    TONE_PORTAMENTO:              '3',           // √
    VIBRATO:                      '4',           // √
    VOLUME_SLIDE_TONE_PORTAMENTO: '5',           // √
    VOLUME_SLIDE_VIBRATO:         '6',           // √
    TREMOLO:                      '7',           // √
    SET_PANNING_POSITION:         '8',
    SET_SAMPLE_OFFSET:            '9',           // √
    VOLUME_SLIDE:                 '10',          // √
    POSITION_JUMP:                '11',          // √
    SET_VOLUME:                   '12',          // √
    PATTERN_BREAK:                '13',          // √
    SET_FILTER:                   '14-0',
    FINE_PORTAMENTO_UP:           '14-1',        // √
    FINE_PORTAMENTO_DOWN:         '14-2',        // √
    GLISSANDO:                    '14-3',
    SET_VIBRATO_WAVEFORM:         '14-4',        // √
    SET_FINE_TUNE:                '14-5',        // √
    PATTERN_LOOP:                 '14-6',        // √
    SET_TREMOLO_WAVEFORM:         '14-7',        // √
    // UNUSED:                    '14-8'
    RETRIGGER_NOTE:               '14-9',        // √
    FINE_VOLUME_SLIDE_UP:         '14-10',       // √
    FINE_VOLUME_SLIDE_DOWN:       '14-11',       // √
    NOTE_CUT:                     '14-12',       // √
    NOTE_DELAY:                   '14-13',       // √
    PATTERN_DELAY:                '14-14',       // √
    FUNKREPEAT:                   '14-15',
    SET_SPEED:                    '15',          // √
};

export const WAVE_TYPES: WaveType[] = ['sine', 'sawtooth', 'square', 'random']; // Do not re-order!

export const UNKNOWN_FORMAT = 'Unknown format';
