import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const vibratoEffect = (p1?: number, p2?: number): EffectProcessor => {
    const onRowStart = (player: Protracker, channel: ProtrackerChannel) => {
        const state = player.getPlaybackState();
        const vibrato = channel.getVibrato();

        vibrato.setOriginalValue(channel.getPeriod());
        if(p1) {
            vibrato.setOscillationsPerRow((p1 * (state.speed - 1)) / 64);
        }
        if(p2) {
            vibrato.setAmplitude(p2 * 2);
        }
    }

    const onRowEnd = (player: Protracker, channel: ProtrackerChannel) => {
        const vibrato = channel.getVibrato();

        if(vibrato.getRetrigger() === false) {
            vibrato.incrementOffset();
        }
        channel.setPeriod(vibrato.getOriginalValue());
    }

    const onTickStart = (player: Protracker, channel: ProtrackerChannel) => {
        const vibrato = channel.getVibrato();

        channel.setPeriod(vibrato.getValue(player.getRowPosition()));
    }

    return {
        onRowStart,
        onRowEnd,
        onTickStart
    }
}

export default vibratoEffect;