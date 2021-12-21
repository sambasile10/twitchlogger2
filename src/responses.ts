/*
 *  Contains interfaces for responses from the API
 *
 */
import { Message } from "./DBManager";
import { UserData } from "./TwitchClient";

 

// Execution metrics, returned from some endpoints
export declare interface Metrics {
    duration: number // Elapsed milliseconds of endpoint call
};

// Blob response from /chat/:channel endpoint
export declare interface ChatQueryData {
    userdata: UserData, // Public user data from TwitchClient
    messages: Message[] // Queried messages from DBManager
};