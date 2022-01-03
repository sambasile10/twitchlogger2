import { channel } from 'diagnostics_channel';
import pgPromise, { ColumnSet } from 'pg-promise';
import { IConnectionParameters } from 'pg-promise/typescript/pg-subset';
import { ILogLevel, Logger } from 'tslog';
import { runInThisContext } from 'vm';
import { ConfigManager } from './Config';

// Extend pg-promise with custom functions for code clarity
interface IExtensions {
    getMessages(channel: string, userID: string): Promise<Message[]>;
    createChannel(channel: string): Promise<void>;
    getTablesForChannel(channel: string): Promise<any>
    sizeOfTable(table: string): Promise<string>;
    dropTable(table: string): Promise<void>;
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

// Query parameters for searching a user's messages in a channel
export declare interface QueryParameters {
    channel: string, // Channel name to query in, required
    user_id: string, // Twitch ID of user, required
    month: number, // Month period to search within, required
    year: number, // Year of month to search within, required
    limit?: number, // Maximum number of messages returned, optional
    skip?: number, // Offset of entries to search, optional
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

        obj.getTablesForChannel = (channel) => {
            return obj.any(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.tables WHERE TABLE_NAME LIKE '${channel}%'; `);
        }

        obj.sizeOfTable = (table) => {
            return obj.one(`SELECT pg_total_relation_size('${table}');`);
        }

        obj.dropTable = (table) => {
            return obj.none(`DROP TABLE IF EXISTS ${table}; `);
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

    // Current month and year, built to seperate database tables
    private currentMonth: number;
    private currentYear: number;

    // Database connection
    private pgp = pgPromise(options);
    private db; // Load database URL from environment

    // Message Buffer <channel name, message array>
    private messageBuffer: Map<string, DBMessage[]>; 

    // pgp ColumnSets, generated once - defines columns in a table
    private columnSets: Map<string, pgPromise.ColumnSet>;

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

        // Get current datetime
        const currentDate = new Date();
        this.currentMonth = currentDate.getUTCMonth() + 1;
        this.currentYear = currentDate.getUTCFullYear();

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
            const table_name: string = this.getCurrentTableName(channel);
            this.db.createChannel(table_name).then(res => {
                this.messageBuffer.set(channel, []); // Create new buffer for channel
                this.columnSets.set(channel, new this.pgp.helpers.ColumnSet([ 'user_id', 'message' ], { table: table_name })); // Create ColumnSet
                this.log.info(`Registered channel '${channel}' with table ${table_name}.`);
                resolve();
            }).catch(err => {
                this.log.error(`Failed to create table for channel '${channel}'.`);
                reject(err);
            });
        });
    }

    // Remove channel from database, if drop_table then the data will be deleted
    async removeChannel(channel: string, drop_table: boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let onRemove = () => {
                // Remove buffer and column set
                this.messageBuffer.delete(channel);
                this.columnSets.delete(channel);
                this.log.info(`Dropped columns and buffer for channel '${channel}'.`);
                resolve();
            };
            
            if(drop_table) {
                this.getTablesByChannel(channel).then(tables => {
                    let tasks: Promise<void>[] = [];
                    tables.forEach((table, index) => {
                        tasks.push(this.db.dropTable(table.table_name));
                    });

                    Promise.all(tasks).then(res => {
                        this.log.info(`Dropped tables for channel '${channel}'.`);
                        onRemove();
                    }).catch(err => {
                        this.log.warn(`Failed to drop tables for channel '${channel}'. `);
                        reject(err);
                    });
                }).catch(err => {
                    reject(err);
                });
            } else {
                onRemove();
            }
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
                //this.log.debug(`Flushed buffer '${channel}' to database.`);
                resolve();
            }).catch(err => {
                this.log.error(`Failed to flush buffer '${channel}' to database.`);
                reject(err);
            });
        });
    }

    async queryMessages(options: QueryParameters): Promise<Message[]> {
        return new Promise<Message[]>((resolve, reject) => {
            const table_name: string = this.getTableName(options.channel, options.month, options.year);
            let query = '';

            if(options.limit == null || options.skip == null) {
                // Use standard query
                query = `SELECT timestamp, message FROM ${table_name} WHERE user_id LIKE '${options.user_id}' ORDER BY id DESC;`;
            } else {
                // Use advanced query
                query = `SELECT timestamp, message FROM ${table_name} WHERE user_id LIKE '${options.user_id}' `
                    + `ORDER BY id DESC OFFSET ${options.skip} ROWS FETCH NEXT ${options.limit} ROWS ONLY;`;
            }

            // Execute query
            this.db.any(query).then(res => {
                resolve(res);
            }).catch(err => {
                this.log.error(`Failed to query messages in channel '${options.channel}' for user with ID '${options.user_id}'.`);
                reject(err);
            });
            
        });
    }

    // Get size of all tables in database, returned as tuples
    async calculateDatabaseSize(): Promise<[string, number][]> {
        return new Promise<[string, number][]>((resolve, reject) => {
            // Build promise array
            let tasks: Promise<number>[] = [];
            ConfigManager.config.channels.forEach(channel => {
                tasks.push(this.db.sizeOfTable(channel.replace('#','')));
            });

            // Execute promises and fill tuples with data
            let tuples: [string, number][] = [];
            Promise.all(tasks).then(res => {
                ConfigManager.config.channels.forEach((channel, index) => {
                    tuples.push([channel, res[index]]); // Push tuple of (name, size)
                });
                this.log.debug(`Successly size queried ${res.length} tables.`);
                resolve(tuples);
            }).catch(err => {
                this.log.warn(`Failed to query table sizes.`);
                reject(err);
            });
        });
    }

    async calculateSizeOfChannel(channel: string): Promise<[string, number][]> {
        return new Promise<[string, number][]>((resolve, reject) => {
            this.getTablesByChannel(channel).then(tables => {
                let tasks: Promise<number>[] = [];
                //this.log.debug(tables);
                for(let i = 0; i < tables.length; i++) {
                    const table = tables[i];
                    tasks.push(this.db.sizeOfTable(table.table_name));
                }

                let tuples: [string, number][] = [];
                Promise.all(tasks).then(res => {
                    tables.forEach((tbl, index) => {
                        tuples.push([tbl, res[index]]);
                    });
                    resolve(tuples);
                }).catch(err => { reject(err); })
            }).catch(err => { reject(err); });
        });
    }

    async getTablesByChannel(channel: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.db.any(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.tables WHERE TABLE_NAME LIKE '${channel}%'; `).then(res => {
                resolve(res);
            }).catch(err => {
                reject(err);
            })
        });
    }

    private getTableName(channel: string, month: number, year: number): string {
        return String(channel.toLowerCase() + "_" + year + "_" + month);
    }

    private getCurrentTableName(channel: string): string {
        return this.getTableName(channel, this.currentMonth, this.currentYear);
    }

};