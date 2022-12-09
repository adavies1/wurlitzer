import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const arpeggioEffect = (p1: number, p2: number): EffectProcessor => {
    const onTickStart = (player: Protracker, channel: ProtrackerChannel) => {
        const state = player.getPlaybackState();
    
        if (state.currentTick % 3 === 0) {
            channel.resetPeriod();
        }
        else if (state.currentTick % 3 === 1) {
            channel.setPeriod(channel.getFineTunedPeriod() / Math.pow(2, p1 / 12));
        }
        else if (state.currentTick % 3 === 2) {
            channel.setPeriod(channel.getFineTunedPeriod() / Math.pow(2, p2 / 12));
        }
    }

    return {
        onTickStart
    }
}

export default arpeggioEffect;