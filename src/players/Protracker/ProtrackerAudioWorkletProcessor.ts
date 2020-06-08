/**
 * Please note
 *
 * There are some typescript scope issues with this file.
 * Support for the special AudioWorkletProcessor and its Worklet scope is not yet implemented.
 *
 * This means that certain hacks have been put in place to fudge it for now.
 */




interface AudioWorkletProcessor {
    readonly port: MessagePort;
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): void;
}

declare var AudioWorkletProcessor: {
    prototype: AudioWorkletProcessor;
    new(options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
}





import Protracker from './Protracker';

class ProtrackerAudioWorkletProcessor extends AudioWorkletProcessor {
    fileData: ArrayBuffer;
    player: Protracker;

    constructor(config: AudioWorkletNodeOptions) {
        super(config);
        this.fileData = config.processorOptions.fileData;
        this.player = new Protracker(((globalThis as unknown) as AudioContext) /* hack */, this.fileData);
        this.port.onmessage = this.onMessage;
    }

    process (inputs:Float32Array[][], outputs:Float32Array[][], parameters:Record<string, Float32Array>) {
        return this.player.onAudioProcess(outputs.map(output => output[0]));
    }

    onMessage = (event: any) => {
        switch(event.data.cmd) {
            case 'play':
                this.player.play();
                break;
            case 'pause':
                this.player.pause();
                break;
            case 'stop':
                this.player.stop();
                break;
        };
    }
}

// @ts-ignore
registerProcessor('protracker', ProtrackerAudioWorkletProcessor) /* hack - registerProcessor is global to AudioWorkletProcessor scope */