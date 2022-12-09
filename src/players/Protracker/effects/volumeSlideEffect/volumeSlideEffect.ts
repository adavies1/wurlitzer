import { minMaxLimit } from "../../../../utils";
import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const volumeSlideEffect = (p1: number, p2: number): EffectProcessor => {
    const onTickStart = (player: Protracker, channel: ProtrackerChannel) => {
        const state = player.getPlaybackState();

        if(state.currentTick > 0) {
            const newVolume = channel.getVolume() + p1 - p2;
            channel.setVolume(minMaxLimit(newVolume, 0, 64));
        }
    }

    return {
        onTickStart
    }
}

export default volumeSlideEffect;