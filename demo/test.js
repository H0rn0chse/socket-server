import path from "path";
import { fileURLToPath } from "url";

import { registerSocketHandler, registerXhrHandler, send, startServer, unregisterSocketHandler } from "../index.js";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const root = path.join(dirname, "../");

startServer({
    host: "localhost",
    port: 3000,
    publicPaths: [
        ["/demo/client", "/"]
    ],
    root
})

registerXhrHandler("get", "/data/blob", (req, res, token) => {
    console.log("received GET request for a data blob");
    const data = {
        id: token,
        some: {
            dataStructure: {
                foo: "bar"
            }
        }
    }
    res.json(data)
    res.end();
});

function handlePing (ws, data, uuid) {
    console.log("received ping, sending pong");
    const response = {
        a: data.a,
        id: uuid
    };
    send(ws, "pong", response);
    unregisterSocketHandler("ping", handlePing);
}

registerSocketHandler("ping", handlePing);