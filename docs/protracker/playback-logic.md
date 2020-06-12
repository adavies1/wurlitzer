# Protracker playback logic

This document will explain things like timing, note frequencies (and how to get them from period values) and mixing channels.

## Table of Contents


## General overview of logic

This is a high level view of what happens when a song is played:

 1. An item in the pattern table is read, starting at the beginning
 2. A row in the corresponding pattern is now processed, starting with the first
     - Each instruction of the row is processed, meaning each channel is updated with the data in the instruction (sample to play, period (note) to play the sample at, effect to apply)
     - Any effects that have been assigned to a channel that should be processed at the start of a row, are now processed
3. Samples are generated for a set amount of time, from each channel.
    - The time in between rows is broken down into slots known as **ticks**. 
    - Some effects are processed at the start of a tick (or at the start of many / all ticks) which essentially changes the settings (variables) available on the channel. This is how effects like smooth note slides are achieved.
4. These sample streams from each channel are mixed together to form a stereo output and played
5. Logic from points 1-4 now loops until all rows/patterns are processed

The devil-in-the-detail comes from the effects that can be applied to each channel. Some are easy to process, while some are quite tricky. Also, the point(s) at when they should be processed is very specific.

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