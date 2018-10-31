import { SampleHeader } from './SampleHeader.interface';

export interface Sample extends SampleHeader {
    audio: Float32Array;
}
