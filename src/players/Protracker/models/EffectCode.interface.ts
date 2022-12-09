/*
    Please note that some effects use the parameter as an 8-bit int,
    Where as some split it and use it as two 4-bit ints. This interface
    provides both (in the form of p, px and py) to make it easier when
    handing the effect.
*/
export interface EffectCode {
    code: number;
    extendedCode: string;
    p:    number;
    px:   number;
    py:   number;
}
