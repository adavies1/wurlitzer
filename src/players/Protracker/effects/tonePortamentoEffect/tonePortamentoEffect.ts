import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const tonePortamentoEffect = (p1?: number): EffectProcessor => {
    const onRowStart = (player: Protracker, channel: ProtrackerChannel) => {
        const instruction = channel.getInstruction();

        if(p1 && p1 > 0) {
            channel.setSlideRate(p1);
        }
        if(instruction && instruction.period) {
            channel.setSlideTarget(instruction.period);
        }
    }

    const onTickStart = (player: Protracker, channel: ProtrackerChannel) => {
        if (channel.getPeriod() > channel.getSlideTarget()) {
            channel.setPeriod(Math.max(channel.getPeriod() - channel.getSlideRate(), channel.getSlideTarget()));
        } else if(channel.getPeriod() < channel.getSlideTarget()) {
            channel.setPeriod(Math.min(channel.getPeriod() + channel.getSlideRate(), channel.getSlideTarget()));
        }
    }

    return {
        onRowStart,
        onTickStart
    }
}

export default tonePortamentoEffect;