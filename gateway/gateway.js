require("dotenv").config({ path: "../.env" });
const WebSocket = require("ws");
const axios = require("axios");
const { onShutdown } = require("node-graceful-shutdown");

const wss = new WebSocket("wss://gateway.discord.gg/?v=10&encoding=json");

let heartbeatInterval = 1000;

wss.on("open", () => {
  console.log("Connected to Discord Gateway");

  // Set interval to send heartbeat every 30 seconds

  setInterval(() => {
    wss.send(
      JSON.stringify({
        op: 1,
        d: Date.now(),
      })
    );
  }, 40000);

  if (!process.env.TOKEN) {
    console.log("No token found");
    process.exit(1);
  }

  // Send identify payload
  wss.send(
    JSON.stringify({
      op: 2,
      d: {
        token: process.env.TOKEN,
        intents: 36352,
        properties: {
          os: "windows",
          browser: "stateless",
          device: "stateless",
        },
      },
    })
  );
});

wss.on("message", async (data) => {
  const payload = JSON.parse(data);

  if (payload.op === 10) {
    heartbeatInterval = payload.d.heartbeat_interval;

    console.log("Heartbeat interval set to " + heartbeatInterval);
  }

  if (payload.op === 0 && payload.t === "MESSAGE_CREATE") {
    try {
      await axios.get("http://localhost:3000", {
        params: {
          message: payload,
        },
      });
    } catch (error) {
      console.log("Server error at " + Date.now());
    }
  }
});

onShutdown(() => {
  console.log("Closing connection to Discord Gateway");
  wss.send(
    JSON.stringify({
      op: 7,
      d: 1000,
    })
  );
  wss.close();
});
