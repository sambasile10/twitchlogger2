import pgPromise, { ColumnSet } from 'pg-promise';
import { Logger } from 'tslog';

// Extend pg-promise with custom functions for code clarity
interface IExtensions {
    getMessages(channel: string, username: string): Promise<any>;
    //writeMessages(channel: string, messages: Message[]): Promise<any>;
    createChannel(channel: string): Promise<void>;
};

// Message object
interface Message {
    userID: string,
    message: string
};

const options: pgPromise.IInitOptions<IExtensions> = {
    extend(obj) {
        obj.getMessages = (channel, username) => {
            return obj.any('SELECT * FROM $1 WHERE username = $2', [channel, username]);
        }

        obj.createChannel = (channel) => {
            return obj.none('CREATE TABLE IF NOT EXISTS $1 ( id SERAL, user_id VARCHAR(10), message VARCHAR(500), PRIMARY KEY(id) ); ');
        }
    }
};

/*
   For database performance, the DBManager will store a buffer of messages to write into the
   database at once when BUFFER_LIMIT number of messages are buffered for a given channel
*/
const BUFFER_LIMIT: number = Number(process.env.ALLOWED_MESSAGE_BUFFER || 10);

export class DBManager {

    private log: Logger = new Logger({ name: "DBManager" });

    // Database connection
    private pgp = pgPromise(options);
    private db = this.pgp(process.env.POSTGRES_URL); // Load database URL from environment

    // Message Buffer <channel name, message array>
    private messageBuffer: Map<string, Message[]>; 

    // pgp ColumnSets, generated once - defines columns in a table
    private columnSets: Map<String, pgPromise.ColumnSet>;

    // Initialize DBManager with list of channels
    constructor(channels: string[]) {
        // Initialize messsage buffer
        this.messageBuffer = new Map<string, Message[]>();

        // Initialize column sets
        this.columnSets = new Map<string, ColumnSet>();
    }

    // Add channel to database
    addChannel(channel: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // Create channel table if it doesn't exist
            this.db.createChannel(channel).then(res => {
                this.messageBuffer.set(channel, []); // Create new buffer for channel
                this.columnSets.set(channel, new pgPromise.ColumnSet([ 'user_id', 'message' ], { table: channel })); // Create ColumnSet
                this.log.info(`Registered channel '${channel}' with database.`);
                resolve();
            }).catch(err => {
                this.log.error(`Failed to create table for channel '${channel}'.`);
                reject(err);
            });
        });
    }

    // Add message to buffer, write if buffer limit is reached
    writeMessage(channel: string, message: Message): void {
        // Add message to buffer
        this.messageBuffer.get(channel).push(message);

        // Check buffer size
        if(this.messageBuffer.get(channel).length >= BUFFER_LIMIT) {
            // Buffer limit execeeded, flush to database
            this.writeBuffer(channel);
        }
    }

    // Flush buffer for a given channel to database
    writeBuffer(channel: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const query = this.pgp.helpers.insert(this.messageBuffer.get(channel), this.columnSets.get(channel));
            this.db.none(query).then(res => {
                this.messageBuffer.set(channel, []); // Reset channel buffer
                this.log.debug(`Flushed buffer '${channel}' to database.`);
                resolve();
            }).catch(err => {
                this.log.error(`Failed to flush buffer '${channel}' to database.`);
                reject(err);
            });
        });
    }

    queryMessages(channel: string, username: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            resolve([]); // TODO query function
        });
    }

};