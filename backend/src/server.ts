import express from 'express';
import { DBManager, QueryParameters } from './DBManager';
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

// Query chat logs in a given channel in a given month
app.get("/chat/:channel/", (req, res) => {
    const metrics_start = performance.now(); // Start metrics timer
    let channel: string = req.params.channel.toLowerCase(); // Channel to query in
    let username: string = String(req.query.username); // Username of user to search for
    res.setHeader('Content-Type', 'application/json');

    // Called on error, send metrics along with error
    const onError = (err) => {
        const duration = performance.now() - metrics_start; // Stop metrics

        // Send error
        return res.status(401).send(JSON.stringify({ metrics: { duration: duration }, error: err }));
    };

    // Fetch user data from given username
    twitchClient.fetchUserData(username, false).then(user_data => {
        if(req.query.month == null || req.query.year == null) {
            onError("Missing parameters (month and year are required)");
        }

        // Call DBManager to query with given options
        const options: QueryParameters = {
            channel: channel, 
            user_id: user_data.id, 
            month: Number(req.query.month),
            year: Number(req.query.year)
        };

        if(req.query.limit)
            options.limit = Number(req.query.limit)

        if(req.query.skip)
            options.skip = Number(req.query.skip)

        dbManager.queryMessages(options).then(messages => {
            dbManager.getTablesByChannel(channel).then(tables => {
                const duration = performance.now() - metrics_start; // Calculate duration
                const response = { // Build response
                    metrics: { duration: duration },
                    userdata: user_data,
                    tables: tables,
                    results: messages.length,
                    messages: messages
                };

                return res.status(200).send(JSON.stringify(response));
            }).catch(err => { onError(err); })
        }).catch(err => { onError(err); });
    }).catch(err => { onError(err); });
});

// Add a channel to the configuration
app.post("/chat/:channel", (req, res) => {
    let channel: string = req.params.channel.toLowerCase();

    // Check if configuration already contains channel
    if(ConfigManager.config.channels.includes(channel)) {
        // Channel already logged, return error
        return res.status(400).send(JSON.stringify({
            error: `Channel '${channel}' is already included in the configuration.`
        }));
    }

    // Anonymous function is called upon an error at any stage
    const onError = (err) => {
        // Reverse config changes - TODO this might be unnesesary
        ConfigManager.config.channels.splice(ConfigManager.config.channels.indexOf(channel), 1);
        ConfigManager.notifyUpdate();

        // Send error
        return res.status(500).send(JSON.stringify({
            error: err
        }));
    };

    // Called on success
    const onSuccess = () => {
        return res.sendStatus(200);
    };

    // First join the channel with the chat client
    chatClient.joinChannel(channel).then(res => {
        // Second all channel to the database
        dbManager.addChannel(channel).then(res => {
            // Finally update Config
            ConfigManager.config.channels.push(channel);
            ConfigManager.notifyUpdate().then(res => {
                onSuccess();
            }).catch(err => { onError(err); })
        }).catch(err => { onError(err); })
    }).catch(err => { onError(err); })
})

// Remove a channel from the configuration
app.delete("/chat/:channel", (req, res) => {
    let channel: string = req.params.channel.toLowerCase();
    let drop_data: boolean = (String(req.query.drop_data) == "true");

    // Check if channel is in configuration
    if(ConfigManager.config.channels.includes(channel) == false) {
        // Channel is not in config, return error
        return res.status(400).send(JSON.stringify({
            error: `Channel '${channel}' is not in the configuration.`
        }));
    }

    // Anonymous function to be called on error
    const onError = (err) => {
        // Add channel back to config
        ConfigManager.config.channels.push(channel);
        ConfigManager.notifyUpdate();

        // Send error
        return res.status(500).send(JSON.stringify({
            error: err
        }));
    };

    // Called on success
    const onSuccess = () => {
        return res.sendStatus(200);
    };

    // First leave the channel chat
    chatClient.leaveChannel(channel).then(res => {
        // Secondly tell the DBManager
        dbManager.removeChannel(channel, drop_data).then(res => {
            // Finally update the config
            ConfigManager.config.channels.splice(ConfigManager.config.channels.indexOf(channel), 1);
            ConfigManager.notifyUpdate().then(res => {
                onSuccess();
            }).catch(err => { onError(err); })
        }).catch(err => { onError(err); })
    }).catch(err => { onError(err); })
});

// Get a list of tracked channels
app.get("/channels", (req, res) => {
    const response = {
        channels: ConfigManager.config.channels
    };

    // Sanitize string, maybe do this elsewhere
    for(let i = 0; i < response.channels.length; i++) {
        response.channels[i] = response.channels[i].replace('#','');
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(200);
    res.end(JSON.stringify(response));
});

// Return size of DB for a given channel
app.get("/service/:channel", (req, res) => {
    let channel: string = req.params.channel.toLowerCase();
    if(!ConfigManager.config.channels.includes(channel)) {
        return res.status(400).send(JSON.stringify({
             err: `Channel '${channel}' does not exist in configuration.` 
        }));
    }

    dbManager.calculateSizeOfChannel(channel).then(data => {
        return res.status(200).send(JSON.stringify({ service: data }));
    }).catch(err => {
        return res.status(500).send(JSON.stringify({ error: err }));
    })
});

app.get("/tables/:channel", (req, res) => {
    if(!req.params.channel)
        return res.sendStatus(400);
    
    const channel: string = String(req.params.channel);
    dbManager.getTablesByChannel(channel).then(result => {
        return res.status(200).send(JSON.stringify({ tables: result }));
    }).catch(err => {
        return res.status(500).send(JSON.stringify({ error: err }));
    });
});

const server = app.listen(process.env.PORT || 8080, () => {
    console.log(`Express running → PORT ${server.address()}`);
});