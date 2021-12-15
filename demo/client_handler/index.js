import { request, setWebSocketOptions, send, registerSocketHandler } from "./socket-server/handler.js";

request("GET", "/data/blob").then(console.log);

registerSocketHandler("socketId", (data) => {
    console.log("socketId", data);
});

registerSocketHandler("pong", (data) => {
    console.log("Recieved pong", data);
});

setWebSocketOptions({
    keepAlive: 30 // 30 sec
});

send("ping", { foo: "bar" });

