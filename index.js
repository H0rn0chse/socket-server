import path from "path";
import { __root } from "./src/utils.js";

// This adapter could be reimplemented
import { Adapter } from "./src/DefaultAdapter.js";
import { AdapterBase as _AdapterBase } from "./src/AdapterBase.js";

let port = parseInt(process.env.PORT, 10) || 8080;
let host = process.env.PORT ? "0.0.0.0" : "localhost";

let publicPaths = [
    ["/client", "/"]
];

let adapter;

export const DefaultAdapter = Adapter;
export const AdapterBase = _AdapterBase;

/**
 * @callback socketCallback
 * @param {WebSocket} ws The WebsocketObject
 * @param {object} data The sent data
 * @param {number} uuid A uuid for the current socket
 */

/**
 * @callback xhrCallback
 * @param {Request} req The Request returned by express
 * @param {Response} res The Response returned by express
 * @param {string} token The access token provided via the headers
 */

/**
 * Creates the default adapter and starts the server.
 * @param {object} options
 * @param {number} [options.port] default=8080
 * @param {string} [options.host] default="localhost"
 * @param {string[][]} [options.publicPaths] default=["/client", "/"]
 */
export function startServer (options = {}) {
    if (adapter) {
        throw new Error("The adapter can only be set once!");
    }
    if (typeof options.port === "number") {
        port = options.port
    }
    if (typeof options.host === "string") {
        host = options.host
    }
    if (Array.isArray(options.publicPaths)) {
        publicPaths = options.publicPaths.map((parts) => {
            return [path.join(__root, parts[0]), parts[1]]
        });
    }
    adapter = new Adapter(port, host, publicPaths);
    adapter.startServer();
}

/**
 * Sets the custom adapter and starts the server.
 * @param {object} customAdapter
 */
export function startCustomServer (customAdapter) {
    if (adapter) {
        throw new Error("The adapter can only be set once!");
    }
    adapter = customAdapter;
    adapter.startServer();
}

/**
 * Registers a handler to a specific channel
 * @param {string} channel
 * @param {socketCallback} callback
 * @param {object} [scope]
 * @returns
 */
export function registerSocketHandler (channel, callback, scope=null) {
    if (!adapter) {
        return new Error("'registerSocketHandler' was called before the adapter was set");
    }
    adapter.registerSocketHandler(channel, callback, scope);
}

/**
 * Unregisters a handler to a specific channel
 * @param {string} channel
 * @param {socketCallback} callback
 * @param {object} [scope]
 */
 export function unregisterSocketHandler (channel, callback, scope=null) {
    if (!adapter) {
        return new Error("'unregisterSocketHandler' was called before the adapter was set");
    }
    adapter.unregisterSocketHandler(channel, callback, scope);
}

/**
 * Registers a handler to a specific XMLHttpRequest
 * @param {string} method The method of the XMLHttpRequest
 * @param {string} path The path gets matched with startsWith
 * @param {xhrCallback} callback
 * @param {object} [scope]
 */
export function registerXhrHandler (method, path, callback, scope=null) {
    if (!adapter) {
        return new Error("'registerXhrHandler' was called before the adapter was set");
    }
    adapter.registerXhrHandler(method, path, callback, scope);
}

/**
 * Unregisters a handler to a specific XMLHttpRequest
 * @param {string} method The method of the XMLHttpRequest
 * @param {string} path The path gets matched with startsWith
 * @param {xhrCallback} callback
 * @param {object} [scope]
 */
 export function unregisterXhrHandler (method, path, callback, scope=null) {
    if (!adapter) {
        return new Error("'unregisterXhrHandler' was called before the adapter was set");
    }
    adapter.unregisterXhrHandler(method, path, callback, scope);
}

/**
 * Publishes a message to all websockets subscribed to a message
 * @param {string} topic
 * @param {string} channel
 * @param {object} data
 */
export function publish (topic, channel, data) {
    if (!adapter) {
        return new Error("'publish' was called before the adapter was set");
    }
    adapter.publish(topic, channel, data);
}

/**
 * Sends a message to a specific WebSocket
 * @param {WebSocket} ws
 * @param {string} channel
 * @param {Object} data
 */
export function send (ws, channel, data) {
    if (!adapter) {
        return new Error("'send' was called before the adapter was set");
    }
    adapter.send(ws, channel, data);
}

/**
 * Subscribes a WebSocket to a topic
 * @param {WebSocket} ws
 * @param {string} topic
 */
export function subscribe (ws, topic) {
    if (!adapter) {
        return new Error("'subscribe' was called before the adapter was set");
    }
    adapter.subscribe(ws, topic);
}

/**
 * Unsubscribes a WebSocket to a topic
 * @param {WebSocket} ws
 * @param {string} topic
 */
export function unsubscribe (ws, topic) {
    if (!adapter) {
        return new Error("'unsubscribe' was called before the adapter was set");
    }
    adapter.unsubscribe(ws, topic);
}
