const req = new XMLHttpRequest();
req.addEventListener("load", () => {
    let data;
    try {
        data = JSON.parse(req.responseText);
    } catch (err) {
        data = req.responseText;
    }
    console.log("XHR data", data);
});
req.addEventListener("error", () => {
    console.error("error");
});
req.addEventListener("abort", ()  => {
    console.error("abort");
});
req.open("GET", "/data/blob", true);
req.setRequestHeader("Authorization", crypto.randomUUID());
req.send();


const host = globalThis.location.origin.replace(/^http/, "ws");
const ws = new WebSocket(`${host}/ws`);
ws.onmessage = (evt) => {
    const message = JSON.parse(evt.data);
    console.log("WebSocket data", message.channel, message.data)
    if (message.channel === "pong") {
        var data = {channel: "ping", data: { a: "b" }}
        ws.send(JSON.stringify(data))
    }
};
ws.onopen = () => {
    console.log("WebSocket open");

    var data = {channel: "ping", data: { a: "b" }}
    ws.send(JSON.stringify(data))
};
ws.onclose = () => {
    console.error("close");
};
ws.onerror = () => {
    console.error("error");
};