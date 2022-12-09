import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const finePortamentoDownEffect = (p1: number): EffectProcessor => {
    const onRowEnd = (player: Protracker, channel: ProtrackerChannel) => {
        channel.setPeriod(channel.getPeriod() + p1);
    }

    return {
        onRowEnd
    }
}

export default finePortamentoDownEffect;