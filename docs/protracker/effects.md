# Protracker effects

## Table of Contents

## Available effects

An instruction can have an effect code and parameter set. These are what make songs far more interesting. The available effects are as follows:

| Name | Code (hex) | Description 
|--|--|--|--|--|
| Arpeggio | 0 | This changes the frequency of the note at each tick, to create a rapidly changing sound, a bit like a chord.
| Portamento up | 1 | This slides the period of the note down by the specified amount each tick, resulting in a note that slides up.
| Portamento down | 2 | This slides the period of the note up by the specified amount each tick, resulting in a note that slides down.
| Tone portamento | 3 | This changes the period of the note currently being played by the given amount, to get it to (or as close to as possible) the specified period on the instruction

## How and when to process each effect