import { minMaxLimit } from "../../../../utils";
import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const fineVolumeSlideUpEffect = (p1: number): EffectProcessor => {
    const onRowStart = (player: Protracker, channel: ProtrackerChannel) => {
        const newVolume = channel.getVolume() + p1;
        channel.setVolume(minMaxLimit(newVolume, 0, 64));
    }

    return {
        onRowStart
    }
}

export default fineVolumeSlideUpEffect;