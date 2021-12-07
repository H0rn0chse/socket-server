import { createServer } from "http";
import express from "express";
import { WebSocketServer } from "ws";

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
            globalThis.console.log(err);
        }
        return oResult;
    }

    send (ws, channel, data) {
        const message = JSON.stringify({
            channel,
            data,
        });
        ws.send(message);
    }

    publish (topic, channel, data) {
        const message = JSON.stringify({
            channel,
            data,
        });
        this.topics.publish(topic, message);
    }

    subscribe (ws, topic) {
        try {
            this.topics.subscribe(ws, topic);
        } catch (err) {
            globalThis.console.error(`subscribe failed: ${topic}`);
        }
    }

    unsubscribe (ws, topic) {
        try {
            this.topics.unsubscribe(ws, topic);
        } catch (err) {
            globalThis.console.error(`unsubscribe failed: ${topic}`);
        }
    }

    handleSocketClose (socketId) {
        const ws = {
            id: socketId,
        };
        super.handleSocketClose(ws);
    }

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
            globalThis.console.log(`Listening to http://${this.host}:${this.port}`);
        });
    }
}
