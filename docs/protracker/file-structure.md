


# Protracker file structure

This file tries to explain how a Protracker file is structured, allowing you to understand and decode it.

## Table of Contents

  * [Overall structure](#overall-structure)
    + [Sample info structure](#sample-info-structure)
    + [Pattern structure](#pattern-structure)
    + [Instruction structure](#instruction-structure)
  * [Variations](#variations)
    + [The old Noisetracker format](#the-old-noisetracker-format)
    + [Standard variations](#standard-variations)
    + [StarTrekker 8 Channel](#startrekker-8-channel)
  * [Extra Tips](#extra-tips)
    + [Obtaining the pattern count](#obtaining-the-pattern-count)
    + [Endianness](#endianness)
    + [Finetune values](#finetune-values)

## Overall structure

A complete Protracker file is structured the following way. Some sections require further breaking down, which will be explained later in the document. This describes **the most common structure**, but be aware **that there are also variations**!

| Section | Offset | Length (bytes) | Description |
|--|--|--|--|
| Song title | 0 | 20 | Title of the song. If the title is not a full 20 chars in length, it will be null-terminated.
| Sample info | 20 | 30\*31 | Information about each sample in the file (30 bytes per sample). See below for [sample info structure](#sample-info-structure).
Pattern count | 950 | 1 | The number of patterns in the song as played. In other words, this is the number of slots used in the pattern table (this is **not** the same as the number of patterns in the file)
Song end jump position | 951 | 1 | The position in the pattern table to jump to when the song ends (making the song loop)
Pattern table | 952 | 128 | Pattern table. This is an array of pattern indexes, which tells you what order patterns should be played in (for example, you could have `[0,1,1,2,3,1]`, which would play pattern `1` three times in total).
File format tag | 1080 | 4 | Four characters that form the file format tag, or 'signature' of the file. Most common is `M.K.`, but there are others. See [variations](#variations) below.
Patterns | 1084 | (4\*CH\*64)\*? | All of the pattern data for the song. Think of a pattern like a sheet of music. The number of patterns in a file is variable, with a (theoretical) maximum of 256. This structure has variants. See [pattern structure](#pattern-structure) and [instruction structure](#instruction-structure) below.
Samples | ??? | variable | All of the sample data for the samples. The length of this section is (obviously) variable.

### Sample info structure

| Section | Offset | Length (bytes) | Format |  Notes |
|--|--|--|--|--|
| Name | 0 | 22 | Chars |  The name of the sample (null terminated string). This is often used for greetings. If it starts with #, it is assumed that this is a message and not an instrument name.
| Length | 22 | 2 | Big-endian word | Multiply this value by 2 to get the sample length in bytes.
| Finetune | 24 | 1 | Signed nibble | Finetune value, between -7 and 7.
| Volume | 25 | 1 | Byte | Volume, from 0-64.
| Repeat offset | 26 | 2 | Big-endian word | The position in the sample that a loop starts. Multiply this value by 2 to get the repeat offset in bytes.
| Repeat length | 28 | 2 | Big-endian word | The number of samples after the repeat offset to play when looping the sample. Multiply this value by 2 to get the repeat length in bytes.

### Pattern structure

As mentioned before, a pattern is a bit like a sheet of music, but more accurately it is like a spreadsheet. A song can (and will) have many of these. A row represents a set of instructions for each channel to do (including a note to play, and an effect to process), a column represents a channel, and a cell represents a single instruction. As the song plays, the rows are processed in order, until eventually all patterns have been processed (played), and then the song will either loop or stop.

               Channel 0       Channel 1          ...          Channel n
           +---------------------------------------------------------------+
    Row 0  |  Instruction  |  Instruction  |  Instruction  |  Instruction  |
           -----------------------------------------------------------------
    Row 1  |  Instruction  |  Instruction  |  Instruction  |  Instruction  |
           -----------------------------------------------------------------
    Row 2  |  Instruction  |  Instruction  |  Instruction  |  Instruction  |
           -----------------------------------------------------------------
    ...This continues...
           -----------------------------------------------------------------
    Row 63 |  Instruction  |  Instruction  |  Instruction  |  Instruction  |
           -----------------------------------------------------------------

While the majority of songs will use patterns with 4 channels, patterns can have a **varying number of channels**, meaning their length may not be the same in one song as they are in another. With the exception of the `FLT8` signature (StarTrekker 8-channel, see [here](#startrekker-8-channel)), instructions for each channel are stored sequentially (one after another).

### Instruction structure

Instructions are 4 bytes long. They are stored in a slightly peculiar fashion, and you have do do a bit of shuffling around of bits:

	 Byte 0     Byte 1     Byte 2     Byte 3
	---------  ---------  ---------  --------
	7654 3210  76543210   7654 3210  76543210
	wwww XXXX  xxxxxxxx   yyyy ZZZZ  zzzzzzzz

| Offset | byte-part | Code | Description
|--|--|--|--|
| 0 | High | wwww | Sample number (part 1) |
| 0 | Low | XXXX | Sample period (part 1) |
| 1 | - | xxxxxxxx | Sample period (part 2) |
| 2 | High | yyyy | Sample number (part 2) |
| 2 | Low | ZZZZ | Effect code |
| 3 | - | zzzzzzzz | Effect parameter(s) |

Using the above table / diagram, you need to reconstruct the data to get the following:

| Codes | length (bits) | Description |
|--|--|--|
| wwwwyyyy | 8 | Sample number |
| XXXXxxxxxxxx | 12 | Sample period
| ZZZZ | 4 | Effect code
| zzzzzzzz | 8 | Effect parameter. If 'effect code' is 15 (0xE), you will need to split this into two 4-bit parameters.



## Variations

The Protracker format started out as a more limited version of the above (known as the Noisetracker format), and then evolved in later versions, offering support for up to 8 channels and 128 patterns. There were also various clones of Protracker, which further added to the variations, and pushed the limits of the format.

### The old Noisetracker format

The Noisetracker format has 15 samples in a song instead of 31, and does not have the file format tag at all. There are 64 rows per pattern.

### Standard variations

Standard variations of the format are detectable by looking at the file format tag (signature). These different signatures denote how many channels are in each pattern:

| Tag | Channels | Notes | 
|--|--|--|
| `M.K.` `M!K!` | 4 | Protracker, `M!K!` means >64 patterns
| `M&K!` | 4 | "Fleg's module train-er" apparently. Most likely just a hand-modified signature.
| `FLT4` | 4 | StarTrekker
| `6CHN` | 6 | Protracker, 6 channels
| `8CHN` | 8 | Protracker, 8 channels
| `CD81`, `OKTA` | 8 | Oktalyzer (Atari ST tracker)
| `OCTA` | 8 | OctaMED tracker
| ``xxCH`` | xx | FastTracker, where xx is >10 and <32 (so `14CH` would mean 14 channels)
| ``xxCN`` | xx | TakeTracker - same as above.
| ``2CHN`` | 2 | FastTracker
| ``TDZx`` | x | TakeTracker, where x is 1, 2 or 3
| ``xCHN`` | x | TakeTracker, where x is 5, 7 or 9

There is the chance that the signature field has been hijacked completely, so be aware of that. There was a lot of effort put into making it difficult to 'rip' resources from a game or demo, and this could be one of many tricks used (it would throw off simpler ripping tools searching for signatures).

### StarTrekker 8 Channel

This variation uses the `FLT8` signature and has 8 channels per row. It follows the above format, but the twist is that instead of recording the row information for each channel sequentially, the pattern for channels 1-4 is stored and then the next pattern holds the data for channels 5-8. You'll probably want to merge these together while decoding the song, so that you can have a consistent structure for your playback routine.

## Extra Tips

Here are some extra bits of info that may help you along your way:

### Obtaining the pattern count

 * As per ByteRaver's notes in Thunder's doc, the best way to get the total number of patterns in a song is to read the pattern table and find the highest index and then add 1 (as the pattern indexes are zero-based). 
 * If the above pattern count method ever fails (never has for me so far), you'll have to separate the header and the sample data, leaving just the pattern data chunk. Then, figure out how many channels you have based on the signature and use it to calculate the length of a pattern `patternLength = 4*channels*64` . Finally, divide the length of the pattern chunk by the pattern length you just calculated `numPatterns = patternChunk.length / patternLength`.

### Endianness

You'll notice that some of the values are **Big-endian word**, which means you need to be careful when decoding their values:
 * Firstly a **word** is two bytes in length. 
 * Endianness describes what each byte in the set (in this case, the word) signifies. On little-endian systems, the byte at the end (right-hand side) of the set signifies the smallest values, where as on big-endian systems, it is the other way around.  For more info on the subject, see [here](https://developer.mozilla.org/en-US/docs/Glossary/Endianness).

**Example**: A word in memory is stored as `0000001 1100010`. On a little-endian system, this would signify `1*256 + 194 = 450`. On a big-endian system, this would signify `1 + 194*256 = 49665`. So, if you use the wrong endianness, you'll get the wrong numerical values when reading your data! 

The reason why big-endian values are used is because the Amiga uses the Motorola 68K CPU, which is natively a big-endian architecture. Modern PC CPUs are little-endian.

### Finetune values

These are signed nibbles (signed 4-bit values). If you don't have an easy way to read these, read the value as an unsigned 8-bit integer and then do `-16 + value`. If you want to be extra safe and zero-out the higher 4 bits, you can either shift the value to the left by 4, and then back to the right by 4, or use modulus 16 `-16 + (value % 16)`. There are likely other ways (bit masks?) but as a JS programmer, this is how i'd do it.