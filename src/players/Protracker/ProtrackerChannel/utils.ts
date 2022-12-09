import { Sample } from "../models/Sample.interface";

/**
 * Applies the given volume to a sample
 * @param sample - Sample value to apply volume to
 * @param volume - The volume value to apply
 */
 export const applyVolumeToSample = (sample: number, volume: number) => {
    return sample * (volume / 64);
}

/**
 * Returns a new fine-tuned period value, based upon given period and finetune parameters
 * @param period - the period value to tune
 * @param fineTune - the finetune value to tune the period by
 */
export const getFineTunedPeriod = (period: number, fineTune: number = 0) => {
    if(fineTune !== 0) {
        if (fineTune > 0) {
            return period / Math.pow(2, Math.abs(fineTune) / (8 * 12))
        }
        else {
            return period * Math.pow(2, Math.abs(fineTune) / (8 * 12))
        }
    }

    return period;
}

/**
 * Returns the sample frequency for the given amiga clock speed and period value
 * @param amigaClockSpeed - The clock speed the amiga machine is running at (differs slightly for PAL and NTSC)
 * @param period - The period value of the sample being played
 */
export const getFrequency = (amigaClockSpeed: number, period: number) => {
    return amigaClockSpeed / (period * 2);
}

/**
 * Returns the next position of the sample to be used. Handles sample looping / ending.
 * @param sample - Sample that is being used
 * @param position - The position to start from when incrementing
 * @param increment - The amount to incrememnt the sample position by
 */
export const getNextSampleIncrement = (sample: Sample, position: number, increment: number) => {
    let nextPosition = position + increment;
    let sampleEnd = getSampleEnd(sample);
    let sampleHasEnded = false;

    if(nextPosition >= sampleEnd) {
        if(sample.repeatLength > 2) {
            nextPosition = sample.repeatOffset + (nextPosition - sampleEnd);
        }
        else {
            nextPosition = sampleEnd;
            sampleHasEnded = true;
        }
    }

    return { nextPosition, sampleHasEnded };
}

/**
 * Returns the end value of the sample, taking into account looping.
 * @param sample - The sample to get the end position for
 */
export const getSampleEnd = (sample: Sample) => {
    if(sample.repeatLength > 2) {
        return sample.repeatOffset + sample.repeatLength;
    }
    return sample.length;
}

/**
 * Returns the value we need to increment the sample position by for the given channel / buffer frequency
 * @param frequency - The frequency the channel is currently running at (see getFrequency)
 * @param bufferFrequency - The frequency for the output audio context buffer (could be 44010 or 48000 etc)
 */
export const getSampleIncrementValue = (frequency: number, bufferFrequency: number) => {
    return frequency / bufferFrequency;
}

/**
 * Returns the sample value for a given sample position (can be a fractional position)
 * @param sampleAudio - Array of sample data
 * @param samplePosition - The position in the sample to get a value for
 */
export const getSampleValue = (sampleAudio: Float32Array, samplePosition: number) => {
    const fractionOfNextSample = samplePosition % 1;
    const lowerSample = sampleAudio[Math.floor(samplePosition)];
    const upperSample = sampleAudio[Math.ceil(samplePosition)];
    return lowerSample + (fractionOfNextSample * (upperSample - lowerSample));
}