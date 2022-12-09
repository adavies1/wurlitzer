import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const patternLoopEffect = (p1: number): EffectProcessor => {
    const onRowEnd = (player: Protracker, channel: ProtrackerChannel) => {
        if(p1 === 0) {
            player.setPatternLoopRowIndex(player.getPlaybackState().currentRowIndex);
        }
        else {
            const loopCount = player.getPatternLoopCount() - 1;
            player.setPatternLoopCount(loopCount);

            if (loopCount < 0) {
                player.setPatternLoopCount(p1);
            }

            if (loopCount > 0) {
                player.setRowIndex(player.getPatternLoopRowIndex());
            }
        }    
    }


    return {
        onRowEnd
    }
}

export default patternLoopEffect;