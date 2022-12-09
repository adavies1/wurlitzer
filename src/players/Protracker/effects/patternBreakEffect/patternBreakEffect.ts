import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const patternBreakEffect = (p1: number, p2: number): EffectProcessor => {
    const onRowEnd = (player: Protracker, channel: ProtrackerChannel) => {
        player.nextPattern() || player.setPatternSequenceIndex(player.getSongLoopIndex());
        player.setRowIndex((10 * p1) + p2);
    }

    return {
        onRowEnd
    }
}

export default patternBreakEffect;