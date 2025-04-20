export enum ACTION {
    PLAY = 80,        // P
    NOTESLIDE = 83,   // S
    REST = 82,        // R
    VOICECHANGE = 86, // V
    STARTLOOP = 108,  // l
    ENDLOOP = 76,     // L
    ENDVOICE = 70,    // E
}

export enum NOTES {
    SEMIBREVE_DOTTED = 24,
    SEMIBREVE = 16,
    MINIM_DOTTED = 12,
    MINIM = 8,
    CROTCHET_DOTTED = 6,
    CROTCHET = 4,
    QUAVER_DOTTED = 3,
    QUAVER = 2,
    SEMI_QUAVER = 1,
}

export const INSTRUCTION_SIZE = 12;