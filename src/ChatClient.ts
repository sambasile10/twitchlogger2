import * as tmi from 'tmi.js';
import { Logger } from 'tslog';
import { ConfigManager } from './Config';
import { DBMessage } from './DBManager';

export class ChatClient {

    private log: Logger;
    private client: tmi.Client;

    // Build TMI client and connect
    constructor() {
        this.log = new Logger({ name: "ChatClient" });
        this.client = new tmi.Client({
            options: { },
            connection: {
                reconnect: true,
                secure: true
            },
            channels: ConfigManager.config.channels
        })

        this.client.connect();
    }

    // Start TMI listeners, takes DBManager write callback as parameterber
    public listen(dbWriteCallback: (channel:string, message: DBMessage) => void): void {
        this.log.debug("TMI Client Listening");

        // Log all messages (includes subs/cheer/etc)
        this.client.on("message", (channel, tags, message, self) => {
            if(self) { return; } // Don't record bot's own activity

            // Construct object to send to database
            const messageObj: DBMessage = {
                user_id: tags['user-id'],
                message: message
            };

            // Call database write function, substring removes the '#' from the channel variable
            dbWriteCallback(channel.substring(1), messageObj);
        });
    }

}