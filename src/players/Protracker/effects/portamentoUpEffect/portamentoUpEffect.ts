import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const portamentoUpEffect = (p1: number): EffectProcessor => {
    const onTickStart = (player: Protracker, channel: ProtrackerChannel) => {
        const state = player.getPlaybackState();

        if(state.currentTick > 0) {
            channel.setPeriod(channel.getPeriod() - p1);
        }
    }


    return {
        onTickStart
    }
}

export default portamentoUpEffect;