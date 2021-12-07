import path from "path";
import { fileURLToPath } from "url";

import { registerSocketHandler, startCustomServer, send, registerXhrHandler, DefaultAdapter } from "../index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const __root = path.join(__dirname, "../");

class CustomAdapter extends DefaultAdapter {
    handleSocketOpen (ws) {
        const uuid = super.handleSocketOpen(ws);
        // do custom user on connect handling
        console.log(`socket with id=${uuid} connected`);
        return uuid;
    }
}

const adapter = new CustomAdapter(3000, "localhost", [[path.join(__root, "/demo/client"), "/"]]);

startCustomServer(adapter);

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
