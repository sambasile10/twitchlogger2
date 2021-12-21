import pgPromise, { ColumnSet } from 'pg-promise';
import { IConnectionParameters } from 'pg-promise/typescript/pg-subset';
import { ILogLevel, Logger } from 'tslog';
import { ConfigManager } from './Config';

// Extend pg-promise with custom functions for code clarity
interface IExtensions {
    getMessages(channel: string, userID: string): Promise<Message[]>;
    createChannel(channel: string): Promise<void>;
};

// Message object for end user consumption
export declare interface Message {
    userID: string,
    timestamp: string,
    message: string
};

// Message object for database consumption (no timestamp)
export declare interface DBMessage {
    user_id: string,
    message: string
};

// User ID tuple for writing to the database
export declare interface UserTuple {
    username: string,
    user_id: string
};

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
            return obj.any(`SELECT * FROM ${channel} WHERE user_id LIKE '${userID}';`);
        }

        obj.createChannel = (channel) => {
            return obj.none(`CREATE TABLE IF NOT EXISTS ${channel} ( id SERIAL, user_id VARCHAR(10), timestamp TIMESTAMP NOT NULL DEFAULT NOW(), message VARCHAR(500), PRIMARY KEY(id) ); `);
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
    private messageBuffer: Map<string, DBMessage[]>; 

    // pgp ColumnSets, generated once - defines columns in a table
    private columnSets: Map<String, pgPromise.ColumnSet>;

    constructor() {}

    // Initialize DBManager, this function is blocking
    public async init(): Promise<void> {
        // Initialize database connection
        const isProduction: boolean = (process.env.NODE_ENV === 'production');
        const dbConfig = (isProduction ? process.env.DATABASE_URL : dev_dbConfig); // Check build environment
        if(process.env.NODE_ENV === 'production') {
            // Change SSL default if in production
            this.pgp.pg.defaults.ssl = { rejectUnauthorized: false };
        }

        this.db = this.pgp(dbConfig as IConnectionParameters);

        // Initialize messsage buffer
        this.messageBuffer = new Map<string, DBMessage[]>();

        // Initialize column sets
        this.columnSets = new Map<string, ColumnSet>();

        // Add all channels to database
        for await (const channel of ConfigManager.config.channels) {
            await this.addChannel(channel.toLowerCase());
        }

        this.log.info("Initialized DBManager!");
    }

    // Add channel to database
    async addChannel(channel: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // Create channel table if it doesn't exist
            this.db.createChannel(channel).then(res => {
                this.messageBuffer.set(channel, []); // Create new buffer for channel
                this.columnSets.set(channel, new this.pgp.helpers.ColumnSet([ 'user_id', 'message' ], { table: channel })); // Create ColumnSet
                this.log.info(`Registered channel '${channel}' with database.`);
                resolve();
            }).catch(err => {
                this.log.error(`Failed to create table for channel '${channel}'.`);
                reject(err);
            });
        });
    }

    // Add message to buffer, write if buffer limit is reached
    async writeMessage(channel: string, message: DBMessage): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // Add message to buffer
            //this.log.debug(`Writing message from ${message.userID} to ${channel}.`);
            this.messageBuffer.get(channel).push(message);

            // Check buffer size
            if(this.messageBuffer.get(channel).length >= BUFFER_LIMIT) {
                // Buffer limit execeeded, flush to database
                this.writeBuffer(channel);
            }

            resolve();
        });
        
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
    async queryMessages(channel: string, user_id: string): Promise<Message[]> {
        return new Promise<Message[]>((resolve, reject) => {
            this.db.getMessages(channel, user_id).then(res => {
                resolve(res);
            }).catch(err => {
                this.log.error(`Failed to query messages in channel '${channel}' for user with ID '${user_id}'.`);
                reject(err);
            });
        });
    }

};