import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";
import { setOscillatorWaveform } from "../utils";

export const setVibratoWaveformEffect = (p1: number): EffectProcessor => {
    const onRowStart = (player: Protracker, channel: ProtrackerChannel) => {
        const vibrato = channel.getVibrato();

        if(p1 <= 7) {
            setOscillatorWaveform(vibrato, p1);
        }
    }

    return {
        onRowStart
    }
}

export default setVibratoWaveformEffect;