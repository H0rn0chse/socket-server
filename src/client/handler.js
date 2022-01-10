import { HandlerMap } from "./HandlerMap.js";
import { KeepAlive } from "./KeepAlive.js";
import { request as _request } from "./request.js";

/**
 * @callback socketCallback
 * @param {object} data The sent data
 */

let token = generateToken();
const host = globalThis.location.origin.replace(/^http/, "ws");
const socketHandler = new HandlerMap(["channel", "callback", "scope"]);
const socketCloseHandler = new HandlerMap(["callback", "scope"]);

function generateToken () {
    // randomUUID is only available in secure context
    // and is not available on Safari on IOS
    if (typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);

    let token = "";
    // xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    // 8-4-4-4-12 => 32
    const separatorIndices = [8, 12, 16, 20];
    buffer.forEach((int, index) => {
        if (separatorIndices.includes(index)) {
            token += "-";
        }
        token += getChar(int);
    });

    return token;
}

function getChar (int) {
    const value = int % 36;
    let charCode;
    // 0-9 => 10 chars (48-57)
    if (value < 10) {
        charCode = value + 48;

    // a-z => 26 chars (97-122)
    } else {
        charCode = (value - 10) + 97;
    }
    return String.fromCharCode(charCode);
}

/**
 * Sets the xhr token
 * @param {string} newToken
 */
export function setToken (newToken) {
    token = newToken;
}

/**
 * Returns the xhr token
 * @returns The current token
 */
export function getToken () {
    return token;
}

/**
 * Sends a request to the server
 * @param {string} method
 * @param {string} path
 * @param {object} [header]
 * @param {object} [body]
 * @returns {Promise<object>} Resolves  with the response of the server
 */
export function request (method, path, header={}, body={}) {
    if (!header.Authorization) {
        header.Authorization = token;
    }
    return _request(method, path, header, body);
}

/**
 * Registers a handler to a specific channel
 * @param {string} channel
 * @param {socketCallback} socketCallback
 * @param {object} [scope]
 */
export function registerSocketHandler (channel, socketCallback, scope=null) {
    socketHandler.set(channel, socketCallback, scope);
}

/**
 * Unregisters a handler to a specific channel
 * @param {string} channel
 * @param {socketCallback} socketCallback
 * @param {object} [scope]
 */
export function unregisterSocketHandler (channel, socketCallback, scope=null) {
    socketHandler.delete(channel, socketCallback, scope);
}

/**
 * Attaches a handler to the close event
 * @param {function} closeCallback
 * @param {object} [scope]
 */
export function attachSocketClose (closeCallback, scope=null) {
    socketCloseHandler.set(closeCallback, scope);
}

/**
 * detaches a handler  the close event
 * @param {function} closeCallback
 * @param {object} [scope]
 */
export function detachSocketClose (closeCallback, scope=null) {
    socketCloseHandler.delete(closeCallback, scope);
}

let socketPromise, keepAlive;
const KEEP_ALIVE_TIMEOUT = 5 * 60; // 5 mins
let keepAliveTimeout = KEEP_ALIVE_TIMEOUT;
const PING_TIMEOUT = 30; // 30 sec;
let keepAlivePingTimeout = PING_TIMEOUT;
const keepAlivePing = send.bind(null, "keep-alive", {});

/**
 * Establishes a new WebSocket connection with new options.
 * Closes the old connection
 * @param {object} options
 * @param {number} [options.keepAlive] default=300
 *      if set to false keepAlive is disabled
 * @param {number} [options.keepAlivePing] default=30
 */
export async function setWebSocketOptions (options={}) {
    // reset current options
    keepAliveTimeout = KEEP_ALIVE_TIMEOUT;
    keepAlivePingTimeout = PING_TIMEOUT;

    if (socketPromise) {
        const socket = await socketPromise;
        socket.close();
    }

    if (typeof options.keepAlive === "number" && options.keepAlive > 0) {
        keepAliveTimeout = options.keepAlive;
    }
    if (typeof options.keepAlivePing === "number" && options.keepAlivePing > 0) {
        keepAlivePingTimeout = options.keepAlivePing;
    }
    if (options.keepAlive === false) {
        keepAliveTimeout = null;
    }

    await getSocket();
}

/**
 * Creates the WebSocket and it's KeeAlive instance
 * @returns {Promise<WebSocket>} Resolves with a WebSocket instance
 */
function getSocket () {
    if (socketPromise) {
        return socketPromise;
    }
    socketPromise = new Promise(function (resolve, reject) {
        const socket = new WebSocket(`${host}/ws`);
        socket.onopen = (evt) => {
            if (keepAliveTimeout) {
                keepAlive = new KeepAlive(keepAlivePing, keepAlivePingTimeout, keepAliveTimeout);
            }
            resolve(socket);
        };
        socket.onerror = (evt) => {
            console.error("Could not connect the WebSocket");
            socketPromise = null;
            reject();
        };
        socket.onmessage = handleSocketMessage;
        socket.onclose = handleSocketClose;
    });
    return socketPromise;
}

/**
 * Handles socket 'message' event.
 * Parses the message and calls callbacks matching the channel
 * @param {Event} evt
 */
function handleSocketMessage (evt) {
    let message;
    try {
        message = JSON.parse(evt.data);
    } catch (err) {
        console.error(err);
    }
    socketHandler.forEach((channel, socketCallback, scope) => {
        if (!message || typeof message !== "object" || message.channel !== channel) {
            return;
        }

        try {
            if (scope) {
                socketCallback.call(scope, message.data);
            } else {
                socketCallback(message.data);
            }
        } catch (err) {
            console.error(err);
        }
    });
}

/**
 * Handles socket 'close' event.
 * Calls all attached listeners
 * @param {Event} evt
 */
function handleSocketClose (evt) {
    keepAlive.doLogoff();
    keepAlive = null;
    socketPromise = null;

    socketCloseHandler.forEach((closeCallback, scope) => {
        try {
            if (scope) {
                closeCallback.call(scope);
            } else {
                closeCallback();
            }
        } catch (err) {
            console.error(err);
        }
    });
}

/**
 * Sends a WebSocket message
 * @param {string} channel
 * @param {Object} data
 * @returns {Promise<void>} Resolves once the message was sent
 */
export async function send (channel, data) {
    const socket = await getSocket();
    const message = JSON.stringify({
        channel,
        data,
    });
    socket.send(message);
}
