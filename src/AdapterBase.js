import crypto from "crypto";

import { HandlerMap } from "./HandlerMap.js";

export class AdapterBase {
    constructor (port, host, publicPaths) {
        this.port = port;
        this.host = host;

        this.publicPaths = publicPaths;

        this.idleTimeout = 55;

        this.socketHandler = new HandlerMap(["channel", "callback", "scope"]);
        this.xhrHandler = new HandlerMap(["method", "path", "callback", "scope"]);
        this.activeSockets = [];
    }

    _uuid (lookup) {
        let id = crypto.randomUUID();
        while (lookup.includes(id)) {
            id = crypto.randomUUID();
        }
        lookup.push(id);
        return id;
    }

    registerSocketHandler (channel, callback, scope) {
        this.socketHandler.set(channel, callback, scope);
    }

    unregisterSocketHandler (channel, callback, scope) {
        this.socketHandler.delete(channel, callback, scope);
    }

    registerXhrHandler (method, path, callback, scope) {
        this.xhrHandler.set(method, path, callback, scope);
    }

    unregisterXhrHandler (method, path, callback, scope) {
        this.xhrHandler.delete(method, path, callback, scope);
    }

    handleSocketOpen (ws) {
        // globalThis.console.log("WebSocket opens");
        ws.id = this._uuid(this.activeSockets);
        this.send(ws, "socketId", {
            id: ws.id,
        });
        return ws.id;
    }

    handleSocketClose (ws) {
        this.handleSocketMessage(ws, {
            channel: "close",
            data: {},
        });
        this.activeSockets.splice(this.activeSockets.indexOf(ws.id), 1);
        // globalThis.console.log("WebSocket closed");
    }

    handleSocketMessage (ws, data) {
        const message = this.parseSocketMessage(data);

        this.socketHandler.forEach((channel, callback, scope) => {
            if (!message || typeof message !== "object" || message.channel !== channel) {
                return;
            }

            try {
                if (scope) {
                    callback.call(scope, ws, message.data, ws.id);
                } else {
                    callback(ws, message.data, ws.id);
                }
            } catch (err) {
                globalThis.console.error(err);
            }
        });
    }

    async handleXhr (req, res, next) {
        const token = req.get("Authorization") || null;
        const handlerPromises = this.xhrHandler.map(async (method, path, callback, scope) => {
            if (req.method !== method.toUpperCase()) {
                return;
            }
            if (!req.path.startsWith(path)) {
                return;
            }

            try {
                if (scope) {
                    await callback.call(scope, req, res, token);
                } else {
                    await callback(req, res, token);
                }
            } catch (err) {
                globalThis.console.error(err);
            }
        });

        if (handlerPromises.length === 0) {
            next();
            return;
        }

        const results = await Promise.allSettled(handlerPromises);
        const requestWasHandled = results.every((res) => {
            return !res;
        });

        if (!requestWasHandled) {
            next();
        }
    }

    parseSocketMessage (data) {
        // need to be implemented by adapter
    }

    send (ws, channel, data) {
        // need to be implemented by adapter
    }

    publish (topic, channel, data) {
        // need to be implemented by adapter
    }

    subscribe (ws, topic) {
        // need to be implemented by adapter
    }

    unsubscribe (ws, topic) {
        // need to be implemented by adapter
    }

    startServer () {
        // need to be implemented by adapter
    }
}
