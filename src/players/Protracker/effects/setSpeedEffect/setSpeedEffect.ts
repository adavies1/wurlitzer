import Protracker from "../../Protracker";
import ProtrackerChannel from "../../ProtrackerChannel/ProtrackerChannel";
import EffectProcessor from "../../models/EffectProcessor.interface";

export const setSpeedEffect = (p1: number): EffectProcessor => {
    const onRowStart = (player: Protracker, channel: ProtrackerChannel) => {
        if(p1 > 31) {
            player.setTempo(p1);
        } else {
            player.setSpeed(p1);
        }
    }

    return {
        onRowStart
    }
}

export default setSpeedEffect;