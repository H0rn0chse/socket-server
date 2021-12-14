import { error } from "console";
import crypto from "crypto";

import { HandlerMap } from "./shared/HandlerMap.js";

/**
 * @callback socketCallback
 * @param {WebSocket} ws The WebsocketObject
 * @param {object} data The sent data.
 * @param {number} uuid A uuid for the current socket
 */

/**
 * @callback xhrCallback
 * @param {Express.Request} req The Request returned by express
 * @param {Express.Response} res The Response returned by express
 * @param {string} token The access token provided via the headers
 */

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

    /**
     * Generates a new uuid and ensures with the lookup array that there are no colissions.
     * @param {string[]} [lookup] The list of generated uuids
     * @returns {string} a new unique uuid
     */
    _uuid (lookup = []) {
        let id = crypto.randomUUID();
        while (lookup.includes(id)) {
            id = crypto.randomUUID();
        }
        lookup.push(id);
        return id;
    }

    /**
     * Registers a handler to a specific channel
     * @param {string} channel
     * @param {socketCallback} socketCallback
     * @param {object} scope
     */
    registerSocketHandler (channel, socketCallback, scope) {
        this.socketHandler.set(channel, socketCallback, scope);
    }

    /**
     * Unregisters a handler to a specific channel
     * @param {string} channel
     * @param {socketCallback} socketCallback
     * @param {object} scope
     */
    unregisterSocketHandler (channel, socketCallback, scope) {
        this.socketHandler.delete(channel, socketCallback, scope);
    }

    /**
     * Registers a handler to a specific XMLHttpRequest
     * @param {string} method The method of the XMLHttpRequest
     * @param {string} path The path gets matched with startsWith
     * @param {xhrCallback} xhrCallback
     * @param {object} scope
     */
    registerXhrHandler (method, path, xhrCallback, scope) {
        this.xhrHandler.set(method, path, xhrCallback, scope);
    }

    /**
     * Unregisters a handler to a specific XMLHttpRequest
     * @param {string} method The method of the XMLHttpRequest
     * @param {string} path The path gets matched with startsWith
     * @param {xhrCallback} xhrCallback
     * @param {object} [scope]
     */
    unregisterXhrHandler (method, path, xhrCallback, scope) {
        this.xhrHandler.delete(method, path, xhrCallback, scope);
    }

    /**
     * Handles socket 'open' event.
     * Creates a uuid for this WebSocket and sends a message to the
     * WebSocket via the channel 'socketId' with the uuid.
     * This uuid might be reused by another WebSocket connection after
     * the current one was closed.
     * @param {WebSocket} ws
     * @returns {string} The uuid of the WebSocket
     */
    handleSocketOpen (ws) {
        ws.id = this._uuid(this.activeSockets);
        this.send(ws, "socketId", {
            id: ws.id,
        });
        return ws.id;
    }

    /**
     * Handles socket 'close' event.
     * Depending on the scenario the WebSocket object might be already undefined.
     * Therefore this method might also recieve an object containing the property 'id'.
     * In addition a fake close message is send to allow server side handlers react upon the close.
     * The uuid might now be reused by another WebSocket connection.
     * @param {object} ws An object with at least the property id
     */
    handleSocketClose (ws) {
        this.handleSocketMessage(ws, {
            channel: "close",
            data: {},
        });
        this.activeSockets.splice(this.activeSockets.indexOf(ws.id), 1);
    }

    /**
     * Handles socket 'message' event.
     * Parses the message and calls callbacks matching the channel
     * @param {WebSocket} ws
     * @param {string|Buffer} data
     */
    handleSocketMessage (ws, data) {
        const message = this.parseSocketMessage(data);

        this.socketHandler.forEach((channel, socketCallback, scope) => {
            if (!message || typeof message !== "object" || message.channel !== channel) {
                return;
            }

            try {
                if (scope) {
                    socketCallback.call(scope, ws, message.data, ws.id);
                } else {
                    socketCallback(ws, message.data, ws.id);
                }
            } catch (err) {
                error(err);
            }
        });
    }

    /**
     * Handles xhr 'request' event.
     * Fetches the token from the header and calls callbacks matching the method and path.
     * If no callback was executed or all failed the next callback is called.
     * @param {Express.Request} req
     * @param {Express.Response} res
     * @param {function} next A callback which skips this filter
     * @returns {Promise<void>} Resolves after all callbacks were executed
     */
    async handleXhr (req, res, next) {
        const token = req.get("Authorization") || null;
        const handlerPromises = this.xhrHandler.map(async (method, path, xhrCallback, scope) => {
            if (req.method !== method.toUpperCase()) {
                return;
            }
            if (!req.path.startsWith(path)) {
                return;
            }

            try {
                if (scope) {
                    await xhrCallback.call(scope, req, res, token);
                } else {
                    await xhrCallback(req, res, token);
                }
                return true;
            } catch (err) {
                error(err);
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

    /**
     * Parses the data to an object.
     * @param {string|Buffer} data The data recieved by the socket 'message' event
     * @returns {object} The parsed data
     */
    parseSocketMessage (data) {
        // need to be implemented by adapter
    }

    /**
     * Sends a message to a specific WebSocket
     * @param {WebSocket} ws
     * @param {string} channel
     * @param {Object} data
     */
    send (ws, channel, data) {
        // need to be implemented by adapter
    }

    /**
     * Publishes a message to all websockets subscribed to a message
     * @param {string} topic
     * @param {string} channel
     * @param {object} data
     */
    publish (topic, channel, data) {
        // need to be implemented by adapter
    }

    /**
     * Subscribes a WebSocket to a topic
     * @param {WebSocket} ws
     * @param {string} topic
     */
    subscribe (ws, topic) {
        // need to be implemented by adapter
    }

    /**
     * Unsubscribes a WebSocket to a topic
     * @param {WebSocket} ws
     * @param {string} topic
     */
    unsubscribe (ws, topic) {
        // need to be implemented by adapter
    }

    /**
     * Starts the server and binds to the WebSocket and xhr events
     */
    startServer () {
        // need to be implemented by adapter
    }
}
