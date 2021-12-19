import pgPromise, { ColumnSet } from 'pg-promise';
import { IConnectionParameters } from 'pg-promise/typescript/pg-subset';
import { ILogLevel, Logger } from 'tslog';

// Extend pg-promise with custom functions for code clarity
interface IExtensions {
    getMessages(channel: string, userID: string): Promise<Message[]>;
    //writeMessages(channel: string, messages: Message[]): Promise<any>;
    createChannel(channel: string): Promise<void>;
};

// Message object for end user consumption
export declare interface Message {
    userID: string,
    timestamp: Date,
    message: string
};

// Message object for database consumption (no timestamp)
export declare interface DBMessage {
    userID: string,
    message: string
}

// Postgres configuration for dev environment
const dev_dbConfig = {
    host: 'db',
    port: '5432',
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
};

const options: pgPromise.IInitOptions<IExtensions> = {
    extend(obj) {
        obj.getMessages = (channel, userID) => {
            return obj.any('SELECT * FROM $1 WHERE user_id = $2', [channel, userID]);
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
const BUFFER_LIMIT: number = Number(process.env.BUFFER_LIMIT || 10);

export class DBManager {

    private log: Logger = new Logger({ name: "DBManager" });

    // Database connection
    private pgp = pgPromise(options);
    private db; // Load database URL from environment

    // Message Buffer <channel name, message array>
    private messageBuffer: Map<string, Message[]>; 

    // pgp ColumnSets, generated once - defines columns in a table
    private columnSets: Map<String, pgPromise.ColumnSet>;

    // Initialize DBManager with list of channels
    constructor() {
        // Initialize database connection
        const isProduction: boolean = (process.env.NODE_ENV === 'production');
        const dbConfig = (isProduction ? process.env.DATABASE_URL : dev_dbConfig); // Check build environment
        if(process.env.NODE_ENV === 'production') {
            // Change SSL default if in production
            this.pgp.pg.defaults.ssl = { rejectUnauthorized: false };
        }

        this.db = this.pgp(dbConfig as IConnectionParameters);

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

    // TODO more options - limit query, between dates, etc
    // Query messages in database
    queryMessages(channel: string, userID: string): Promise<Message[]> {
        return new Promise<Message[]>((resolve, reject) => {
            this.db.getMessages(channel, userID).then(res => {
                resolve(res);
            }).catch(err => {
                this.log.error(`Failed to query messages in channel '${channel}' for user '${userID}'.`);
                reject(err);
            });
        });
    }

};