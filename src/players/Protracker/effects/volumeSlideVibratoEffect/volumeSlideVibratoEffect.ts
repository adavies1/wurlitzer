import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";
import vibratoEffect from "../vibratoEffect/vibratoEffect";
import volumeSlideEffect from "../volumeSlideEffect/volumeSlideEffect";

export const volumeSlideVibratoEffect = (p1: number, p2: number): EffectProcessor => {
    const volumeSlide = volumeSlideEffect(p1, p2);
    const vibrato = vibratoEffect(); // continuation of last vibrato, hence no params

    const onRowStart = (player: Protracker, channel: ProtrackerChannel) => {
        volumeSlide.onRowStart && volumeSlide.onRowStart(player, channel);
        vibrato.onRowStart && vibrato.onRowStart(player, channel);
    }

    const onRowEnd = (player: Protracker, channel: ProtrackerChannel) => {
        volumeSlide.onRowEnd && volumeSlide.onRowEnd(player, channel);
        vibrato.onRowEnd && vibrato.onRowEnd(player, channel);
    }

    const onTickStart = (player: Protracker, channel: ProtrackerChannel) => {
        volumeSlide.onTickStart && volumeSlide.onTickStart(player, channel);
        vibrato.onTickStart && vibrato.onTickStart(player, channel);
    }

    return {
        onRowStart,
        onRowEnd,
        onTickStart
    }
}

export default volumeSlideVibratoEffect;