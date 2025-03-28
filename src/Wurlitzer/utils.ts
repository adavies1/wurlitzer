import { PlayerInitInfo } from "../players/models/PlayerInitInfo.interface";

// Utility functions
export function addAmigaMixer(audioContext: AudioContext, player: AudioWorkletNode): ChannelMergerNode {
    const mixer = new ChannelMergerNode(audioContext, { numberOfInputs: 2 });
    const volume = audioContext.createGain();

    // If song has 4 channels, mimick amiga left/right split (LRRL)
    if(player.numberOfOutputs === 4) {
        [0,3].forEach(index => player.connect(mixer, index, 0));
        [1,2].forEach(index => player.connect(mixer, index, 1));
    }
    // Otherwise, just assume the channels alternate (LRLRLR...)
    else {
        [...new Array(player.numberOfOutputs)]
            .map((item, index) => index)
            .filter(index => index % 2 === 0)
            .forEach(index => player.connect(mixer, index, 0));

        [...new Array(player.numberOfOutputs)]
            .map((item, index) => index)
            .filter(index => index % 2 !== 0)
            .forEach(index => player.connect(mixer, index, 1));
    }

    // The output is super loud as we just added all of the waves together without reducing them.
    // Reduce volume to ((1 / channels) * 100)% to get back to sensible volume.
    volume.gain.value = 1 / player.numberOfOutputs;

    // Connect mixer to gain node (volume fixer)
    mixer.connect(volume);

    return volume;
}

export async function getFilePlayer(players: PlayerInitInfo[], fileData: ArrayBuffer, audioContext: AudioContext): Promise<AudioWorkletNode> {
    let requiredPlayer:PlayerInitInfo | undefined;

    players.forEach(player => {
        try {
            requiredPlayer = {...player, options: player.getInitOptions(fileData)}
        }
        catch(e) {
            // We get here if the player does not support the song (or something went wrong), continue to try other players
        }
    });

    if(!requiredPlayer) {
        throw new Error('This file is not supported');
    }

    try {
        return new AudioWorkletNode(audioContext, requiredPlayer.name, requiredPlayer.options);
    }
    catch(e) {
        await audioContext.audioWorklet.addModule(requiredPlayer.path);
        return new AudioWorkletNode(audioContext, requiredPlayer.name, requiredPlayer.options);
    }
}