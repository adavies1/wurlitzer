import Protracker from "../Protracker";
import ProtrackerChannel from "../ProtrackerChannel/ProtrackerChannel";

export interface EffectProcessor {
    onRowStart?: (player: Protracker, channel: ProtrackerChannel) => void;
    onRowEnd?:(player: Protracker, channel: ProtrackerChannel) => void;
    onTickStart?:(player: Protracker, channel: ProtrackerChannel) => void;
}

export default EffectProcessor;