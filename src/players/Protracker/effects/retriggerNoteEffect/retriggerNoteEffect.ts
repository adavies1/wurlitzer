import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const retriggerNoteEffect = (p1: number): EffectProcessor => {
    const onTickStart = (player: Protracker, channel: ProtrackerChannel) => {
        const state = player.getPlaybackState();

        if (state.currentTick % p1 === 0) {
            channel.setSamplePosition(0);
        }
    }

    return {
        onTickStart
    }
}

export default retriggerNoteEffect;