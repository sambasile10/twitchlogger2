import pgPromise from 'pg-promise';

// Extend pg-promise with custom functions for code clarity
interface IExtensions {
    getMessages(channel: string, username: string): Promise<any>;
    writeMessags(channel: string, messages: Message[]): Promise<any>;
};

// Message object
interface Message {
    username: string,
    timestamp: Date, // TODO: change data type?
    message: string
};

const options: pgPromise.IInitOptions<IExtensions> = {
    extend(obj) {
        obj.getMessages = (channel, username) => {
            return obj.any('SELECT * FROM $1 WHERE username = $2', [channel, username]);
        }
    }
};

export class DBManager {
    
    private pgp = pgPromise(options);
    private db = this.pgp(process.env.POSTGRES_URL); // Load database URL from environment

    constructor() {}

    

};