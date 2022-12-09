import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";
import tonePortamentoEffect from "../tonePortamentoEffect/tonePortamentoEffect";
import volumeSlideEffect from "../volumeSlideEffect/volumeSlideEffect";

export const volumeSlideTonePortamentoEffect = (p1: number, p2: number): EffectProcessor => {
    const volumeSlide = volumeSlideEffect(p1, p2);
    const tonePortamento = tonePortamentoEffect(); // continuation of last tone portamento, hence no params

    const onRowStart = (player: Protracker, channel: ProtrackerChannel) => {
        volumeSlide.onRowStart && volumeSlide.onRowStart(player, channel);
        tonePortamento.onRowStart && tonePortamento.onRowStart(player, channel);
    }

    const onRowEnd = (player: Protracker, channel: ProtrackerChannel) => {
        volumeSlide.onRowEnd && volumeSlide.onRowEnd(player, channel);
        tonePortamento.onRowEnd && tonePortamento.onRowEnd(player, channel);
    }

    const onTickStart = (player: Protracker, channel: ProtrackerChannel) => {
        volumeSlide.onTickStart && volumeSlide.onTickStart(player, channel);
        tonePortamento.onTickStart && tonePortamento.onTickStart(player, channel);
    }

    return {
        onRowStart,
        onRowEnd,
        onTickStart
    }
}

export default volumeSlideTonePortamentoEffect;