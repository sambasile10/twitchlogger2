import * as fs from 'fs';
import { Logger } from 'tslog';

// TODO remove optional from properties
export declare interface Config {
    channels?: string[], // Channels to be tracked
    client_authorization?: string, // OAuth Bearer token, this is dynamic
    client_id?: string // ID of application on Twitch API
    client_secret?: string // Secret of application on Twitch API
    tmi_debug?: boolean // Log level of tmi.js client
}

// Read config path from environment
const CONFIG_PATH = process.env.CONFIG_PATH || String(__dirname+'/config.json');

export class ConfigManager {

    private static log: Logger = new Logger({ name: "ConfigManager" });

    // Global configuration object
    public static config: Config = {};

    // Read configuration to global static object
    public static readConfig(): void {
        let rawText = fs.readFileSync(CONFIG_PATH).toString(); // Note: blocks execution
        ConfigManager.config = JSON.parse(rawText) as Config;
        this.log.debug(`TMI Debug: ${ConfigManager.config.tmi_debug}`);
        this.log.debug(`Read config file '${CONFIG_PATH}'.`);
    }

    public static async update(): Promise<void> {
        let configData = JSON.stringify(ConfigManager.config);
        fs.writeFile(CONFIG_PATH, configData, (err) => {
            if(err) {
                this.log.warn(`Failed to write configuration to '${CONFIG_PATH}'. Error: ${JSON.stringify(err)}`);
            }
        });
    }

    // Write config object in memory to file
    public static notifyUpdate(): void {
        try {
            let configData = JSON.stringify(ConfigManager.config)
            fs.writeFileSync(CONFIG_PATH, configData);
            this.log.debug("Updated configuration with file system.");
        } catch (error) {
            this.log.warn(`Failed to write configuration to '${CONFIG_PATH}'.`);
        }
    }

}