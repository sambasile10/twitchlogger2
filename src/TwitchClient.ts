import axios from 'axios';
import { Logger } from 'tslog';
import { ConfigManager } from './Config';


/* Response JSON
 *  TODO remove this
 *   {
 *     "access_token": "xxxxxxxxxxxxxxxxx",
 *     "expires_in": 999999,
 *     "token_type": "bearer"
 *   }
 */ 
declare interface OAuthTokenData {
    access_token: string,
    expires_in: number,
    token_type: string
};

/*
 *  Twitch API users endpoint response
 *  https://dev.twitch.tv/docs/api/reference/#get-users
 */ 
declare interface GetUsersResponse {
    data: UserData[]
}

declare interface UserData {
    id: string, // User ID
    login?: string,
    display_name?: string,
    type?: string,
    broadcaster_type?: string,
    description?: string,
    profile_image_url?: string,
    offline_image_url?: string,
    view_count?: string,
    email?: string,
    created_at?: string
};

export class TwitchClient {
    
    private log: Logger = new Logger({ name: "TwitchClient" })

    constructor() {}

    // Uses config secrets to get a OAuth token
    async fetchBearerToken(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            axios.post(
                `https://id.twitch.tv/oauth2/token?client_id=${ConfigManager.config.client_id}&client_secret=${ConfigManager.config.client_secret}&grant_type=client_credentials`
            ).then(res => {
                let token = res.data.access_token;
                ConfigManager.config.client_authorization = token; // Add new token to config 
                ConfigManager.notifyUpdate(); // Update configuration
                this.log.info(`Successfully fetched new OAuth bearer token from Twitch. It will expire in ${res.data.expires_in} seconds.`);
                resolve(token);
            }).catch(err => {
                this.log.fatal(`Failed to fetch OAuth bearer token with status ${err.response!.status}`);
                reject(err);
            });
        });
    }

    // Fetch user data from a given username
    async fetchUserData(username: string): Promise<UserData> {
        return new Promise<UserData>((resolve, reject) => {
            axios.get(
                `https://api.twitch.tv/helix/users?login=${username}`,
                { // Configuration, include auth headers
                    headers: {
                        'Authorization': `Bearer: ${ConfigManager.config.client_authorization}`,
                        'Client-ID': `${ConfigManager.config.client_id}`
                    }
                }
            ).then(res => {
                // Cast GET response to our object, response is returned as array
                let userData: UserData = (res.data as GetUsersResponse)[0];
                this.log.debug(`Fetched user data for '${username}' with user ID: '${userData.id}'`);
                resolve(userData);
            }).catch(err => {
                // Handle fetch error, if the response status is 401 (unauthorized) then fetch a new bearer token
                this.log.error(`Failed to fetch user data for '${username}' with status: ${err.response!.status}.`);
                if(err.response!.status === 401) {
                    // Fetch new bearer token
                    this.log.info("Fetching new bearer token...");
                    this.fetchBearerToken();
                }

                reject(err);
            });
        });
    }

}