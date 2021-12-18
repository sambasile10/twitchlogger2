import * as tmi from 'tmi.js';
import { Logger } from 'tslog';

export class TwitchClient {

    private log: Logger;
    private client: tmi.Client;

    // Build TMI client and connect
    constructor() {
        this.log = new Logger({ name: "TwitchClient" });
        this.client = new tmi.Client({
            options: { debug: true }, // TODO move client options
            connection: {
                reconnect: true,
                secure: true
            },
            channels: [ 'sodapoppin' ]
        });

        this.client.connect();
    }

    // Start TMI listeners
    private listen(): void {
        this.log.debug("TMI Client Listening");

        // Log all messages (includes subs/cheer/etc)
        this.client.on("message", (channel, tags, message, self) => {
            if(self) { return; } // Don't record bot's own activity

            const messageObj = {
                username: tags['display-name'],
                message: message
            };
        });
    }

}