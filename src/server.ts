import express from 'express';
import { DBManager } from './DBManager';
import * as dotenv from "dotenv";

dotenv.config({ path: __dirname+'/.env' });
const app = express();

app.get("/", (req, res) => {

});

let dbManager: DBManager = new DBManager();

const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Express running → PORT ${server.address()}`);
});