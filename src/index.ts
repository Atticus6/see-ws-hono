import { Hono } from "hono";
import { createBunWebSocket, serveStatic } from "hono/bun";
import type { ServerWebSocket } from "bun";
import { stream, streamText, streamSSE } from "hono/streaming";

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();

const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    let intervalId: Timer;
    return {
      onOpen(_event, ws) {
        intervalId = setInterval(() => {
          ws.send(new Date().toString());
        }, 200);
      },
      onClose() {
        clearInterval(intervalId);
      },
      onMessage(evt, ws) {
        console.log(evt.data);
      },
    };
  })
);

let id = 0;
app.get("/sse", async (c) => {
  return streamSSE(c, async (stream) => {
    while (true) {
      const message = `It is ${new Date().toISOString()}`;
      await stream.writeSSE({
        data: message,
        event: "time-update",
        id: String(id++),
      });
      await stream.sleep(1000);
    }
  });
});

export default {
  fetch: app.fetch,
  websocket,
};
