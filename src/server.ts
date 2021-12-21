import express from 'express';
import { DBManager } from './DBManager';
import * as dotenv from "dotenv";
import { ConfigManager } from './Config';
import { ChatClient } from './ChatClient';
import { TwitchClient } from './TwitchClient';

// Load environment
dotenv.config({ path: __dirname+'/.env' });
const app = express();

// Load configuration
ConfigManager.readConfig();

// Load helper classes
let dbManager: DBManager = new DBManager();
let chatClient: ChatClient;
dbManager.init().then(res => {
    // Start chat client
    chatClient = new ChatClient();
    chatClient.listen(dbManager.writeMessage.bind(dbManager)); // Start chat client with db callback
});

// Start twitch client
let twitchClient: TwitchClient = new TwitchClient();
twitchClient.checkAPIConnection().then(res => {}); // TODO complete promise

// Query chat logs in a given channel
app.get("/chat/:channel/", (req, res) => {
    let channel: string = req.params.channel.toLowerCase(); // Channel to query in
    let username: string = String(req.query.username); // Username of user to search for
    res.setHeader('Content-Type', 'application/json');

    // Fetch user data from given username
    twitchClient.fetchUserData(username, false).then(user_data => {
        // Call DBManager to query with given options
        dbManager.queryMessages(channel, user_data.id).then(messages => {
            // Respond with Messages[] response as JSON
            res.status(200);
            res.end(JSON.stringify(messages));
        }).catch(err => {
            // Respond with error
            res.status(401);
            res.end(JSON.stringify({ error: err }));
        });
    }).catch(err => {
        // Respond with error
        res.status(401);
        res.end(JSON.stringify({ error: err }));
    });
});

const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Express running → PORT ${server.address()}`);
});