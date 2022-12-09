interface AudioWorkletProcessor {
    readonly port: MessagePort;
    process(
      inputs: Float32Array[][],
      outputs: Float32Array[][],
      parameters: Record<string, Float32Array>
    ): boolean;
}

declare var AudioWorkletProcessor: {
    prototype: AudioWorkletProcessor;
    new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
};

declare function registerProcessor(
    name: string,
    processorCtor: (new (
      options?: AudioWorkletNodeOptions
    ) => AudioWorkletProcessor) & {
      parameterDescriptors?: AudioParamDescriptor[];
    }
): void;




import Protracker from './Protracker';

class ProtrackerAudioWorkletProcessor extends AudioWorkletProcessor {
    fileData: ArrayBuffer;
    player: Protracker;

    constructor(config: AudioWorkletNodeOptions = {}) {
        super(config);
        const audioContext = (globalThis as unknown) as AudioContext; // hack as current scope isnt defined properly

        this.fileData = config.processorOptions.fileData;
        this.player = new Protracker(audioContext, this.fileData);
        this.port.onmessage = this.onMessage.bind(this);
    }

    process (inputs:Float32Array[][], outputs:Float32Array[][], parameters:Record<string, Float32Array>) {
        const notFinished = this.player.onAudioProcess(outputs.map(output => output[0]));

        if(!notFinished) {
            this.port.postMessage({ message: 'ended' });
        }

        return notFinished;
    }

    onMessage (event: any) {
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
            case 'getInfo':
                this.port.postMessage({
                    message: 'songInfo',
                    value: this.player.getSong()
                });
        };
    }
}

registerProcessor('protracker', ProtrackerAudioWorkletProcessor) /* registerProcessor is global to AudioWorkletProcessor scope */