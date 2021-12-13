# socket-server
Extends express.js and ws server with some utilities

 * [Getting Started](#getting-started)
 * [Libraries](#libraries)

## Getting Started
This project is available as [npm package](https://www.npmjs.com/package/@h0rn0chse/socket-server).

### Installation
```javascript
npm i @h0rn0chse/socket-server
```
### Basic Usage
```javascript
import { registerSocketHandler, registerXhrHandler, send, startServer } from "@h0rn0chse/socket-server";

startServer({
    host: "localhost",
    port: 3000
})

registerXhrHandler("get", "/data/blob", (req, res, token) => {
    res.json({ foo: "bar" })
    res.end();
});

registerSocketHandler("ping", (ws, data, uuid) => {
    send(ws, "pong", { foo: "bar" });
});
```

For more examples see the [documentation](https://github.com/H0rn0chse/socket-server/wiki/Documentation) and the demo files [test.js](./demo/test.js) and [test_custom.js](./demo/test_custom.js).

## Libraries
 * WebSockets [github.com/websockets/ws](https://github.com/websockets/ws)
 * Request Handling [github.com/expressjs/express](https://github.com/expressjs/express)
