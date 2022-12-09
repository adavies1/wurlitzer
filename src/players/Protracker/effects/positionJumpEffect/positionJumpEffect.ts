import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const positionJumpEffect = (p1: number): EffectProcessor => {
    const onRowEnd = (player: Protracker, channel: ProtrackerChannel) => {
        player.setPatternSequenceIndex(p1, true);
    }

    return {
        onRowEnd
    }
}

export default positionJumpEffect;