# Protracker effects

## Table of Contents

  * [Effect parameters](#effect-parameters)
  * [Effect scope](#effect-scope)
    + [Effect memory](#effect-memory)
  * [Available effects](#available-effects)
  * [How and when to process each effect](#how-and-when-to-process-each-effect)
  * [Extra notes](#extra-notes)
    + [Pattern jump endless loops](#pattern-jump-endless-loops)

## Effect parameters

Effects are made up of two bytes, one byte for the **effect code** and one byte for the **parameter**. Many effects also treat the parameter byte as two parameter nibbles (two 4-bit values) split as `xxxx yyyy`. For effect code 14 (E in hex), the first parameter `xxxx` is also used as part of the effect code, and the second parameter `yyyy` is used by the effect.

## Effect scope

Effects are used to change variables used by the playback routine. Many of them affect the channel they are used on, but they can also affect parameters at a song level (such as the 'Set speed' command).

### Effect memory

A lot of effects are not limited to just the row that they appear on. A lot of the time, the variables they change stay changed until something else overwrites them. For example, the 'Set speed' command sets the speed of the song, which stays at that new speed forever (or until another 'set speed' command is issued).

A lot of effects set variables against a channel. Channels therefore need to have their own state / memory, to keep track of their variables, which may well be different to the other channels. There is more information on the scope of the effects in the [How and when to process each effect](#how-and-when-to-process-each-effect) section.


## Available effects

An instruction can have an effect code and parameter set. These are what make songs far more interesting. The available effects are as follows (please note that more technical detail about how parameters and processing works will come after this):

| Name | Code (hex) | Description 
|--|--|--|
| Arpeggio | 0 | This changes the period of the note at each tick, to create a rapidly changing pitch, a bit like a chord.
| Portamento up | 1 | This slides the period currently being played down by the specified amount each tick, resulting in a pitch that slides up.
| Portamento down | 2 | This slides the period currently being played up by the specified amount each tick, resulting in a pitch that slides down.
| Tone portamento | 3 | This changes the period currently being played by the given amount each tick, to get it to (or as close to as possible) the specified period on the instruction (target period).
| Vibrato | 4 | This oscillates the period currently being played according to a set waveform, with both the speed and amplitude of oscillation being specified as part of the effect.
| Volume slide & tone portamento | 5 | This will continue a previously specified tone portamento, but also allow a volume slide (effect A).
| Volume slide & vibrato | 6 | This will continue a previously specified vibrato, but also allow a volume slide (effect A).
| Tremolo | 7 | This oscillates the volume according to a set waveform, with both the speed and amplitude of oscillation being specified as part of the effect.
| Set panning position | 8 | Allows the panning position of the output audio to be set. This is not supported by Protracker, but is supported by most clones and playback routines.
| Set sample offset | 9 | This will start a sample from a specified position, rather than at the beginning. The offset can only be specified in multiples of 256, so this effect does not allow for pinpoint accuracy.
| Volume slide | A | This slides the volume on the current channel up or down by the specified amount each tick.
| Position jump | B | This will jump to the specified index in the pattern table after the current row has completed. If the index is invalid, the song jumps to the start of the pattern table.
| Set volume | C | Sets the volume of the current channel to the amount specified.
| Pattern break | D | This will jump to the next position in the pattern table after the current row has finished processing, and start from the specified row.
| Set filter | E0 | This is Amiga specific, and can be used to turn the hardware audio filter present on the Amiga on or off.
| Fine portamento up | E1 | Decrement the current period playing by the specified amount at the end of the row.
| Fine portamento down | E2 | Increment the current period playing by the specified amount at the end of the row.
| Set glissando | E3 | This effects the way the 'tone portamento' effect works. If set to on, then the 'tone portamento' will slide in half-notes each tick, otherwise if set to off, 'tone portamento' acts in the usual way.
| Set vibrato waveform | E4 | Sets the waveform used for vibrato and if the position in the waveform should be reset at the start of each row (known as retriggering). Possible  waveforms are sine, ramp-down (sawtooth), square and random (from the previous 3).
| Set finetune | E5 | Sets the fine tune value for the channel.
| Pattern loop | E6 | Can be used to either mark the starting row of the loop, or create a loop back to the previously set start point (row), looping the given amount of times.
| Set tremolo waveform | E7 | Sets the waveform used for tremolo and if the position in the waveform should be reset at the start of each row (known as retriggering). Possible  waveforms are sine, ramp-down (sawtooth), square and random (from the previous 3).
| Unused | E8 | -
| Retrigger note | E9 | This will retrigger (set back to the start) the sample position for this channel after the given amount of ticks. Playback continues as normal, making this sound like the same note is being played over and over very quickly (often used for hi-hats).
| Fine volume slide up | EA | This will add the specified number to the channel volume at the end of the row.
| Fine volume slide down | EB | This will subtract the specified number from the channel volume at the end of the row.
| Note cut | EC | This will set the channel volume to 0 after the specified number of ticks.
| Note delay | ED | This will wait for the specified number of ticks before playing the sample from the beginning.
| Invert loop / funk repeat | EE | This was first 'funkrepeat', and was then updated to be 'invert loop' The sample will be played backwards at the specified speed.
| Set speed | F | Sets the speed / tempo of the song to the specified number (what gets updated depends on how high the value is).


## How and when to process each effect

This section will give you pointers on how to actually implement each effect and at what point each effect will need to be (re)evaluated. This table is what has taken me the most time to figure out.

Please note that in the below table, if the parameter byte uses the whole byte, it will be described as `p`. if it is two 4-bit parameters, they will be described as `px` and `py` (where `p` is split as `xxxx yyyy`).

| Name | Code (hex) | Scope | When to process | How to process
|--|--|--|--|--|
| Arpeggio | 0 | Channel | Every tick start | On first tick, reset channel to normal fine tuned period value (base period). On the next tick, set the channel period to the base period plus `px`. On the next tick, set the channel period to the base period plus `py`. Repeat these three steps for the entire row (so if there were 6 ticks, you would do two rounds of those three steps.)
| Portamento up | 1 | Channel | Every tick end | Decrement the current channel period value by `py` at the end of every tick
| Portamento down | 2 | Channel | Every tick end | Increment the current channel period value by `py` at the end of every tick
| Tone portamento | 3 | Channel | Every tick start | Set the channel `slideRate` to `p`. Set channel `slideTarget` to the period given in the instruction. If either are not specified, use the previously stored values on the channel. On every tick start, change the channel period value by the `slideRate` to get closer to the channel `targetPeriod`. Do not go past the `targetPeriod`. If the channel has `glissando` enabled, instead of using `slideRate`, multiply or divide the period value by the twelfth root of 2, to change it by one note (known as a half-step) each tick.
| Vibrato | 4 | Channel | Every tick start | At the start of the row, set up your oscillator. At the start of each tick, set the channel period to the starting period plus the value from your oscillator, given the current position in the row. See [oscillators](oscillators.md) document.
| Volume slide & tone portamento | 5 | Channel | See effect 3 / A | Continue 'tone portamento' using variables already stored against the channel. Process 'volume slide' using given effect parameters.
| Volume slide & vibrato | 6 | Channel | See effect 4 / A | Continue 'vibrato' using variables already stored against the channel. Process 'volume slide' using given effect parameters.
| Tremolo | 7 | Channel | Every tick start | At the start of the row, set up your oscillator. At the start of each tick, set the channel volume to the starting volume plus the value from your oscillator, given the current position in the row. See [oscillators](oscillators.md) document.
| Set panning position | 8 | Song | Row start | This affects how channels are mixed together. Set your panning position based upon `p`, with 0 being most left and 255 being most right. 
| Set sample offset | 9 | Channel | Row start | Set the channel `samplePosition` to `p * 256`.
| Volume slide | A | Channel | Every tick start except first | Add `px` to the channel volume **and** subtract `py` from the channel volume (only one of the two parameters can ever be set at a time legally). Do not exceed the allowed volume range of 0-64.
| Position jump | B | Song | Row end | Set the songs `currentPatternSequenceIndex` to `p`. If that value is invalid, set `currentPatternSequenceIndex` to 0.
| Set volume | C | Channel | Row start | Set the volume of the current channel to `p`. Do not exceed the allowed volume range of 0-64.
| Pattern break | D | Song | Row end | Increment the songs `currentPatternSequenceIndex` by 1, and then set the songs `currentRow` to `(10 * px) + py`.
| Set filter | E0 | Song | Row start | The filter should be ON if `px` is 0, otherwise the filter should be OFF. You do not need to implement this effect, it's purely a 'nice to have' if it makes sense for the platform you are writing your player for.
| Fine portamento up | E1 | Channel | Row end | Decrement the channels current period value by `py`
| Fine portamento down | E2 | Channel | Row end | Increment the channels current period value by `py`
| Set glissando | E3 | Channel | Row start | Set the `glissando` flag of the channel to `true` if `py` is greater than 0, or `false` if not.
| Set vibrato waveform | E4 | Channel | Row start | Set the vibrato oscillator waveform to the following, based upon `py`: <table><tr><th>py</th><th>Waveform</th><th>Retrigger</th></tr><tr><td>0 / 4</td><td>Sine</td><td>No / Yes</td></tr><tr><td>1 / 5</td><td>Ramp-down (sawtooth)</td><td>No / Yes</td></tr><tr><td>2 / 6</td><td>Square</td><td>No / Yes</td></tr><tr><td>3 / 7</td><td>Random (from above 3)</td><td>No / Yes</td></tr></table>
| Set finetune | E5 | Channel | Row start | Set the fine tune value for the channel to `py`. This should be overwritten when a new sample is assigned to the channel (to the finetune value of the sample), or if another E5 command is issued on this channel. Otherwise, it stays and affects subsequent notes.
| Pattern loop | E6 | Song | Row end | If `py` is 0, set song `loopStartPoint` to `currentRow`. If `py` is greater than 0, set up a loop to jump back to the `loopStartPoint` row `py` times. They key here is that if you're already looping and you encounter this effect, you decrement your loop counter and then jump. If you're not already looping, you need to set up a loop. Please also read the [Pattern jump endless loops](#pattern-jump-endless-loops) section.
| Set tremolo waveform | E7 | Channel | Row start | The same as effect E4, but sets the oscillator for the tremolo instead of the vibrato.
| Unused | E8 | - | - | - |
| Retrigger note | E9 | Effect | Every tick start | Set the channel sample position to 0 every `py` ticks. You should do this at the start of the effect (tick 0) too, so its easiest to do `if(curentTick % py) === 0 { // set sample position to 0 }`
| Fine volume slide up | EA | Channel | Row end | Increment the channel volume by `py`. Do not exceed the allowed volume range of 0-64.
| Fine volume slide down | EB | Channel | Row end | decrement the channel volume by `py`. Do not exceed the allowed volume range of 0-64.
| Note cut | EC | Channel | Every tick start | If `currentTick` is equal to `py`, set the channel volume to 0. If `py` is 0, the channel volume will be set to 0 immediately.
| Note delay | ED | Channel | Every tick start | Do not play the note on the channel until `py` number of ticks has passed. My code sets `sampleHasEnded` on the channel to `true` until `currentTick` is equal to `py`. I then set `sampleHasEnded` to `false` and `samplePosition` to 0, so that in the next tick, the note plays.
| Invert loop / funk repeat | EE | Channel | Every tick start | The mystery command. Not yet implemented, will update when I do. This effect has an old and new mode, where old was 'funkrepeat' and new is 'invert loop'. 
| Set speed | F | Song | Row start | if `p` is greater than 31, set the song `tempo` to `p`. Else, set the song `speed` to `p`.



## Extra notes

### Pattern jump endless loops

Endless loops can be created in songs using the pattern loop effect, because it does not take into account which row was used to set up the loop. Imagine the following were instructions for a channel:

| Period | Effect | px | py |
|--|--|--|--|
| 428 | E | 6 | 0 |
| 428 | E | 6 | 2 |
| 428 | E | 6 | 2 |

What happens here is as follows:

 1. In row 0, The `loopStartPoint` is set to row 0. Playback continues to row 1.
 3. Due to the effect in row 1, a loop is set up and playback jumps back to `loopStartPoint`, every time row 1 is encountered until the loop counter reaches 0
 4. When the loop set up in row 1 has finished, the song continues to row 2
 5. Due to the effect on row 2, a loop is set up, and playback jumps back to `loopStartPoint`
 6. When row 1 is encountered, the loop counter is decremented and playback jumps to `loopStartPoint`, **even though this isn't the instruction that set up the currently active loop!** This happens twice as the loop counter was set to 2.
 7. As the loop has now finished, the song continues to row 2 
 8. Go to 4. We're now in an endless loop.
