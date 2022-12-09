import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const setFineTuneEffect = (p1: number): EffectProcessor => {
    const onRowStart = (player: Protracker, channel: ProtrackerChannel) => {
        const instruction = channel.getInstruction();

        if (instruction && instruction.period !== 0) {
            const newFineTune = p1 < 8 ? p1 : -16 + p1;
            channel.setFineTune(newFineTune);
        }
    }

    return {
        onRowStart
    }
}

export default setFineTuneEffect;