import { log } from "console";

import { registerSocketHandler, registerXhrHandler, send, startServer } from "../index.js";


startServer({
    host: "localhost",
    port: 3000,
    publicPaths: [
        ["/demo/client_handler", "/"]
    ]
});

registerXhrHandler("get", "/data/blob", (req, res, token) => {
    log("received GET request for a data blob");
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

registerSocketHandler("ping", (ws, data, uuid) => {
    log("received ping, sending pong");
    const response = {
        a: data.a,
        id: uuid
    };
    send(ws, "pong", response);
});
