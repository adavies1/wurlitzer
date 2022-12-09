import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const setSampleOffsetEffect = (p1: number): EffectProcessor => {
    const onRowStart = (player: Protracker, channel: ProtrackerChannel) => {
        channel.setSamplePosition(256 * p1);
    }

    return {
        onRowStart
    }
}

export default setSampleOffsetEffect;