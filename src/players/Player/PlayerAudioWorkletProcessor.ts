import Player from "./Player";

export class PlayerAudioWorkletProcessor extends AudioWorkletProcessor {
    player: Player;

    constructor(config: AudioWorkletNodeOptions = {}, playerClass: new (...args: ConstructorParameters<typeof Player>) => Player) {
        super(config);

        const audioContext = (globalThis as unknown) as AudioContext; // hack as current scope isnt defined properly
        const fileData = config.processorOptions.fileData;

        this.player = new playerClass(audioContext, fileData);
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
            case 'getInfo':
                this.port.postMessage({
                    message: 'getInfo',
                    value: this.player.getInfo()
                });
                break;
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