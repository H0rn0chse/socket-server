import { createServer } from "http";
import express from "express";
import { WebSocketServer } from "ws";
import { log, error } from "console";

import { AdapterBase } from "./AdapterBase.js";
import { TopicManager } from "./TopicManager.js";

export class Adapter extends AdapterBase {
    constructor (port, host, publicPaths) {
        super(port, host, publicPaths);

        this.app = express();
        this.httpServer = createServer(this.app);

        const socketOptions = {
            path: "/ws",
            server: this.httpServer,
        };
        this.wss = new WebSocketServer(socketOptions);
        this.topics = new TopicManager();
    }

    /**
     * Parses the data to an object.
     * @param {string|Buffer} data The data recieved by the socket 'message' event
     * @returns {object} The parsed data
     */
    parseSocketMessage (data) {
        if (Buffer.isBuffer(data)) {
            const buffer = Buffer.from(data);
            data = buffer.toString();
        }
        if (typeof data !== "string") {
            return data;
        }

        let oResult = {};
        try {
            const string = data;
            oResult = JSON.parse(string);
        } catch (err) {
            error(err);
        }
        return oResult;
    }

    /**
     * Sends a message to a specific WebSocket
     * @param {WebSocket} ws
     * @param {string} channel
     * @param {Object} data
     */
    send (ws, channel, data) {
        const message = JSON.stringify({
            channel,
            data,
        });
        ws.send(message);
    }

    /**
     * Publishes a message to all websockets subscribed to a message
     * @param {string} topic
     * @param {string} channel
     * @param {object} data
     */
    publish (topic, channel, data) {
        this.topics.publish(topic, channel, data);
    }

    /**
     * Subscribes a WebSocket to a topic
     * @param {WebSocket} ws
     * @param {string} topic
     */
    subscribe (ws, topic) {
        try {
            this.topics.subscribe(ws, topic);
        } catch (err) {
            error(`subscribe failed: ${topic}`);
        }
    }

    /**
     * Unsubscribes a WebSocket to a topic
     * @param {WebSocket} ws
     * @param {string} topic
     */
    unsubscribe (ws, topic) {
        try {
            this.topics.unsubscribe(ws, topic);
        } catch (err) {
            error(`unsubscribe failed: ${topic}`);
        }
    }

    /**
     * Creates a mock WebSocket since the original
     * socket was already destroyed and unsusbscribes
     * from all subscribed topics
     * @param {string} socketId
     */
    handleSocketClose (socketId) {
        const ws = {
            id: socketId,
        };
        this.topics.unsubscribeAll(ws);
        super.handleSocketClose(ws);
    }

    /**
     * Starts the server and binds to the WebSocket and xhr events
     */
    startServer () {
        this.publicPaths.forEach((path) => {
            const [absolutePath, relativePath] = path;
            if (relativePath === "/") {
                this.app.use(express.static(absolutePath));
            }
            this.app.use(relativePath, express.static(absolutePath));
        });

        this.app.use(this.handleXhr.bind(this));

        this.wss.on("connection", (ws) => {
            const socketId = this.handleSocketOpen(ws);

            ws.on("message", this.handleSocketMessage.bind(this, ws));

            ws.on("close", this.handleSocketClose.bind(this, socketId));
        });

        this.httpServer.listen(this.port, this.host, () => {
            log(`Listening to http://${this.host}:${this.port}`);
        });
    }
}
