import express from 'express';
import { DBManager } from './DBManager';
import * as dotenv from "dotenv";
import { ConfigManager } from './Config';
import { TwitchClient } from './TwitchClient';

// Load environment
dotenv.config({ path: __dirname+'/.env' });
const app = express();

// Load configuration
ConfigManager.readConfig();

// Load helper classes
let dbManager: DBManager = new DBManager();
dbManager.init().then(res => {
    let chatClient: TwitchClient = new TwitchClient();
    chatClient.listen(dbManager.writeMessage.bind(dbManager)); // Start chat client with db callback
});

// Query chat logs in a given channel
app.get("/chat/:channel/", (req, res) => {
    let channel: string = req.params.channel; // Channel to query in
    let username: string = String(req.query.username); // Username of user to search for
    res.setHeader('Content-Type', 'application/json');

    // Call DBManager to query with given options
    dbManager.queryMessages(channel, username).then(messages => {
        // Respond with Messages[] response as JSON
        res.status(200);
        res.end(JSON.stringify(messages));
    }).catch(err => {
        // Respond with error
        res.status(401);
        res.end(JSON.stringify({ error: err }));
    });
});

const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Express running → PORT ${server.address()}`);
});