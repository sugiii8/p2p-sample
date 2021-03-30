const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 8082, clientTracking: true });
const clients = server.clients;
const CAPACITY = 2;

server.on("connection", ws => {
  ws.on("message", message => {
    const msg = JSON.parse(message);

    if (msg.type === "join") {
      if (clients.size === 1) {
        ws.send(JSON.stringify({ type: "joined" }));
        ws.name = msg.name;
        console.log("joined: ", msg.name, " nums: ", clients.size);
      }
      else if (clients.size <= CAPACITY) {
        ws.name = msg.name;
        console.log("joined: ", msg.name);
        for (const client of clients) {
          if (ws !== client) {
            client.send(JSON.stringify({ type: "matched", remoteName: ws.name, offerer: false }));
            ws.send(JSON.stringify({ type: "matched", remoteName: client.name, offerer: true }));
          }
        }
      }
      else {
        ws.send(JSON.stringify({ type: "failed" }));
        console.log("cannnot join: ", msg.name);
      }
    }
    if (msg.type === "accept") {
      for (const client of clients) {
        if (ws !== client) {
          console.log("send accept");
          client.send(JSON.stringify({ type: "accepted" }));
        }
      }
    }
    if (msg.type === "offer" || msg.type === "answer") {
      for (const client of clients) {
        if (ws !== client) {
          console.log("send ", msg.type, " to ", client.name, " of ", ws.name);
          client.send(JSON.stringify(msg));
        }
      }
    }
  });

  ws.on("close", () => {
    console.log("bye. remains: ", clients.size);
  })
})
