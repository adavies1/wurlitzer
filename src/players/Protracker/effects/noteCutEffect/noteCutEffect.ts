import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const noteCutEffect = (p1: number): EffectProcessor => {
    const onTickStart = (player: Protracker, channel: ProtrackerChannel) => {
        const state = player.getPlaybackState();

        if (state.currentTick === p1) {
            channel.setVolume(0);
        }
    }

    return {
        onTickStart
    }
}

export default noteCutEffect;