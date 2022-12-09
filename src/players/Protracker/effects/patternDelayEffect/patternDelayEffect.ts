import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const patternDelayEffect = (p1: number): EffectProcessor => {
    const onRowEnd = (player: Protracker, channel: ProtrackerChannel) => {
        player.setPatternDelay(p1 * player.state.speed);
    }

    return {
        onRowEnd
    }
}

export default patternDelayEffect;