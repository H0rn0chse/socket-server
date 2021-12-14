import { log } from "console";
import path from "path";
import { fileURLToPath } from "url";

import { unregisterSocketHandler, registerSocketHandler, startCustomServer, send, registerXhrHandler, DefaultAdapter } from "../index.js";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const root = path.join(dirname, "../");

class CustomAdapter extends DefaultAdapter {
    handleSocketOpen (ws) {
        const uuid = super.handleSocketOpen(ws);
        // do custom user on connect handling
        log(`socket with id=${uuid} connected`);
        return uuid;
    }
}

const adapter = new CustomAdapter(3000, "localhost", [[path.join(root, "/demo/client"), "/"]]);

startCustomServer(adapter);

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

function handlePing (ws, data, uuid) {
    log("received ping, sending pong");
    const response = {
        a: data.a,
        id: uuid
    };
    send(ws, "pong", response);
    unregisterSocketHandler("ping", handlePing);
}

registerSocketHandler("ping", handlePing);
