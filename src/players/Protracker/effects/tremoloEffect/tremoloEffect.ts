import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const tremoloEffect = (p1: number, p2: number): EffectProcessor => {
    const onRowStart = (player: Protracker, channel: ProtrackerChannel) => {
        const state = player.getPlaybackState();
        const tremolo = channel.getTremolo();

        tremolo.setOriginalValue(channel.getVolume());
        tremolo.setOscillationsPerRow((p1 * (state.speed - 1)) / 64);
        tremolo.setAmplitude(p2 * 2);
    }

    const onRowEnd = (player: Protracker, channel: ProtrackerChannel) => {
        const tremolo = channel.getTremolo();

        if(tremolo.getRetrigger() === false) {
            tremolo.incrementOffset();
        }
        channel.setVolume(tremolo.getOriginalValue());
    }

    const onTickStart = (player: Protracker, channel: ProtrackerChannel) => {
        const tremolo = channel.getTremolo();

        channel.setVolume(tremolo.getValue(player.getRowPosition()));
    }

    return {
        onRowStart,
        onRowEnd,
        onTickStart
    }
}

export default tremoloEffect;