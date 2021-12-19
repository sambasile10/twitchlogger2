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
let chatClient: TwitchClient = new TwitchClient();
chatClient.listen(dbManager.writeMessage); // Start chat client with db callback

app.get("/", (req, res) => {

});

const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Express running → PORT ${server.address()}`);
});