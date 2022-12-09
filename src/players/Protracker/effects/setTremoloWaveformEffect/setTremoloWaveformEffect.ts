import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";
import { setOscillatorWaveform } from "../utils";

export const setTemoloWaveformEffect = (p1: number): EffectProcessor => {
    const onRowStart = (player: Protracker, channel: ProtrackerChannel) => {
        const tremolo = channel.getTremolo();

        if(p1 <= 7) {
            setOscillatorWaveform(tremolo, p1);
        }
    }

    return {
        onRowStart
    }
}

export default setTemoloWaveformEffect;