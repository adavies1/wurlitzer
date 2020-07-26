# Protracker playback logic

This document will explain things like timing, note frequencies (and how to get them from period values) and mixing channels.

## Table of Contents

  * [General overview of logic](#general-overview-of-logic)
  * [Song length](#song-length)
    + [The Pattern Sequence](#the-pattern-sequence)
    + [Song end and looping](#song-end-and-looping)
  * [Timing](#timing)
    + [Calculating tick length in ms](#calculating-tick-length-in-ms)
    + [Calculating tick length in samples](#calculating-tick-length-in-samples)
  * [Notes and Periods](#notes-and-periods)
    + [Getting sample values for a note](#getting-sample-values-for-a-note)
    + [Changing note frequencies](#changing-note-frequencies)
    + [Finetune values](#finetune-values)
    + [The Period Table](#the-period-table)

## General overview of logic

This is a high level view of what happens when a song is played:

 1. An item in the pattern table is read, starting at the beginning. This tells us which pattern to play.
 2. A row in the corresponding pattern is now processed, starting with the first
     - Each instruction of the row is processed, meaning each channel is updated with the data in the instruction (sample to play, period (note) to play the sample at, effect to apply)
     - Any effects that have been assigned to a channel that should be processed at the start of a row, are now processed
3. Samples are generated for a set amount of time, for each channel.
    - The time in between rows is broken down into slots known as **ticks**
    - Some effects are processed at the start of a tick (or at the start of many / all ticks) which essentially changes the settings (variables) available on the channel. This is how effects like smooth note slides are achieved.
4. These sample streams from each channel are mixed together to form a stereo output and played
5. Logic from points 1-4 now loops until all rows/patterns are processed

The devil-in-the-detail comes from the effects that can be applied to each channel. Some are easy to process, while some are quite tricky. Also, the point(s) at when they should be processed is very specific.

## Song length

The length of the song and how you handle the end of the song (looping) is affected by a few different things described below.

### The pattern sequence

Each song has a pattern sequence, which is essentially a list that holds the order that the patterns should be played in. This list can also hold duplicate numbers, which allows the same pattern to be played more than once.

Generally, your aim is to get from the start to the finish of the pattern sequence, playing all of the notes and processing all of the effects of each row of each pattern along the way.

Be aware that **the pattern sequence may need to be truncated** if it is longer than the number specified in **songLength**. For example, if **songLength** was `32`, but you had `40` indexes in your pattern sequence, you should drop the last 8 indexes!

### Song end and looping

The song ends when you get to the end of the pattern specified by the final index in the pattern sequence. When this happens, you can either stop the song, or you can loop.

To loop the song, set your current pattern sequence index variable to the value of **songLoop**. Be aware that there seems to be a quirk with this, that **songLoop** should always be 0. If this proves incorrect, I shall update this info.

## Timing

The timing for a Protracker song is broken down into a few different parts:

 * The smallest chunk of time is known as a **tick**. The time that passes between processing a row is broken up into multiple ticks.
 * A song has a **speed** value, which defaults to 6. This signifies how many **ticks** there are between **rows**
 * A song has a **tempo** value, which defaults to 125. This signifies **beats-per-minute**
 * There are 4 **rows per beat**

Both **speed** and **tempo** can be changed during playback (using effect codes), but **rows per beat** is fixed.

When programming a playback routine, you'll end up needing to calculate either how long a tick is (if you're on specific hardware and you're using timers / interrupts), or you'll need to know how many samples a tick is worth (if you're creating a stream, and you know how many samples are generated per second).

### Calculating tick length in ms

 1. Multiply the **tempo** (beats-per-minute) by **rows-per-beat** to give you the **rows-per-minute**: `125 * 4 = 500`
 2. Divide your **rows-per-minute** value by 60 to give you **rows-per-second**: `500 / 60 = 8.33`
 3. Multiply your **rows-per-second** value by **speed** (ticks-per-row) to give you **ticks-per-second**: `8.33 * 6 = 50`
 4. Finally, divide 1000ms by **ticks-per-second** to give you the length of a tick in ms: `1000 / 50 = 20ms`.

To put it on one line:
```javascript
let tickLengthMs = 1000 / (((tempo * 4) / 60) * speed)
```

### Calculating tick length in samples

 1. Multiply the **tempo** (beats-per-minute) by **rows-per-beat** to give you the **rows-per-minute**: `125 * 4 = 500`
 2. Divide your **rows-per-minute** value by 60 to give you **rows-per-second**: `500 / 60 = 8.33`
 3. Multiply your **rows-per-second** value by **speed** (ticks-per-row) to give you **ticks-per-second**: `8.33 * 6 = 50`
 4. You need to know how many samples need to be generated per-second. This is likely to be 44010 or 48000.
 5. Divide your **samples-per-second** value by **ticks-per-second** to get your **samples-per-tick** value (this will need to be rounded): `44010 / 50 = 880`

To put it on one line:
```javascript
let samplesPerTick = samplesPerSecond / (((tempo * 4) / 60) * speed)
```

## Notes and Periods

To play a sample at different pitches (notes), we need to change the frequency of that waveform. Another way to look at this is, for the given amount of time, we either need to output the sample data quicker or slower to play higher or lower notes. This is known as **frequency shifting**.

When a note is specified as part of an instruction, it is stored as a **period** value. These are divisor values that are related to the Amiga CPU clock speed. The Amiga CPU ran at a speed of 7.09MHZ (77093789.2HZ) in PAL mode, or 7.15MHZ (7159090.5HZ) in NTSC mode. To calculate the frequency needed for a note, we divide the CPU clock speed by double the period value:

```javascript
const amigaClockFreq = 77093789.2; // For PAL system
const noteFreq = amigaClockFreq / (2 * period);
```

This means that there is a slight difference in the pitch of a song, depending on if the Amiga was using PAL or NTSC mode. You'll need top choose which clock speed to use for your playback routine (or if you want to be fancy, allow the user to toggle between the two).

### Getting sample values for a note

Now that we know how to calculate the **frequency** required for a specific note from a **period** value, we need to know how to use that when generating samples. For this, we need to calculate how much we need to increment the sample position counter by every time we take a sample. To do this, we divide the **note frequency** value by the **output frequency**.

```javascript
const amigaClockFreq = 77093789.2; // For PAL system
const ouputFreq = 44010; // 44.1KHZ output
const period = 428;
const noteFreq = amigaClockFreq / (2 * period); // 8288HZ
const sampleIncrement = noteFreq / outputFreq; // 0.188
const output = [];
const samplesPerTick = 8000;

let samplePosition = 0;
let i = 0;

for(i=0; i<samplesPerTick; i++) {
    output[i] = readSampleData(samplePosition);
    samplePosition = samplePosition + sampleIncrement;
}
```

The above pseudo code shows the main idea. For the first sample in the tick we read the data for the channel sample at index 0. For the next sample, we read the data from the channel sample at index 0.188 (you'll have to calculate the difference between index 0 and index 1, then multiply by 0.188).To play a sample at a lower note, you would expect a lower **sampleIncrement** value, meaning we'll end up playing less of the sample data over a given amount of time. A higher note would be the opposite.

I apologise for the overuse of the word **sample**. I do appreciate that it can get quite confusing! You have samples stored in the file, which are assigned to channels. These samples are then *sampled* again at different frequencies, depending on the note being played when we're generating the output samples for a tick. Not confusing at all! =/


### Changing note frequencies

Octaves have 12 notes in them, and a note played one octave higher has a frequency that is double that of the note one octave lower. So, to jump an octave, you either divide or multiply the note frequency by 2. To change a note, you can divide/multiply by a twelfth root of two:

```javascript
const noteFreq = 4144; // C-1

let noteFreqOneOctaveHigher = noteFreq * 2;
let noteFreqOneNoteHigher = noteFreq * Math.pow(2, (1 / 12));
let noteFreqFiveNotesHigher = noteFreq * Math.pow(2, (5 / 12));
```

This also works with period values, but you have to do the inverse:

```javascript
const notePeriod = 856; // C-1

let notePeriodOneOctaveHigher = notePeriod / 2;
let notePeriodOneNoteHigher = notePeriod / Math.pow(2, (1 / 12));
let notePeriodFiveNotesHigher = notePeriod / Math.pow(2, (5 / 12));
```

### Finetune values

These work on the same idea as above, but it allows you to specify a note to be adjusted by a small amount. Finetune values range from -7 to 7, meaning that a note can be set to up to 8 values (0,1,2,3,4,5,6,7) higher or lower. So, instead of there being 12 notes in an octave, there are now 96, if you include finetune values. So, to calculate a finetuned frequency, you can do this:

```javascript
if(fineTune !== 0) {
    if (fineTune > 0) {
        freq = freq * Math.pow(2, Math.abs(fineTune) / (8 * 12))
    }
    else {
        freq = freq / Math.pow(2, Math.abs(fineTune) / (8 * 12))
    }
}
```

Just like before, you do the inverse for period values:

```javascript
if(fineTune !== 0) {
    if (fineTune > 0) {
        period = period / Math.pow(2, Math.abs(fineTune) / (8 * 12))
    }
    else {
        period = period * Math.pow(2, Math.abs(fineTune) / (8 * 12))
    }
}
```

### The Period Table

As the CPU power of the Amiga was limited, instead of calculating period values all of the time, There was a table of period values and their corresponding frequencies stored in memory, which were **hard coded**. This is also true for all finetune values (so there were quite a few tables). Please see [Thunder's doc](MODFIL12.TXT) for the actual values.

While this is a good idea for performance, the problem is that these values were a bit odd, and one or two of them are considered to be incorrect. Did the author calculate these values by hand on a calculator, and then make a mistake? Who knows. However, what this means is that **if you want 100% accurate Protracker playback, you have to use the tables**. If you want 'close enough', and you have the CPU power, you can just calculate the frequency values as we did in the [changing note frequencies](#changing-note-frequencies) section (this is easier to code!).