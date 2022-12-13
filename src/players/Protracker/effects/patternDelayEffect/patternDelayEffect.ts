import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const patternDelayEffect = (p1: number): EffectProcessor => {
    const onRowStart = (player: Protracker, channel: ProtrackerChannel) => {
        player.setPatternDelay(p1 * player.state.speed);
    }

    return {
        onRowStart
    }
}

export default patternDelayEffect;