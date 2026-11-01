// Explicit disposable-database, loopback-only integration fixture. Never serve
// this file or copy its known test-only settings into a real deployment.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createServer as tcpServer } from "node:net";
import { createServer } from "node:http";
const require = createRequire(new URL("../../package.json", import.meta.url));
if (!process.env.AUTH_TEST_DATABASE_URL)
  throw new Error("Set AUTH_TEST_DATABASE_URL to a disposable migrated test database.");
process.env.DATABASE_URL = process.env.AUTH_TEST_DATABASE_URL;
Object.assign(process.env, {
  AUTH_BASE_URL: "http://127.0.0.1:3302",
  AUTH_SECRET: "private-test-fixture-only-not-a-deployment-secret-2026",
  AUTH_PUBLIC_SIGNUP: "true",
  PRIVACY_CONTROLLER_NAME: "Automated test controller, not a public operator",
  PRIVACY_CONTACT_EMAIL: "test-controller@example.invalid",
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: "10252",
  SMTP_SECURE: "false",
  SMTP_ALLOW_LOCAL_PLAINTEXT: "true",
  MAIL_FROM: "test-mail@example.invalid",
  AUTH_TRUSTED_IP_HEADER: "x-test-client-ip",
  NEXT_TELEMETRY_DISABLED: "1",
});
const messages = [];
const smtp = tcpServer((socket) => {
  socket.setEncoding("utf8");
  socket.write("220 localhost test SMTP\r\n");
  let buffer = "",
    data = false,
    message = "";
  socket.on("data", (chunk) => {
    buffer += chunk;
    if (buffer.length > 262144) return socket.destroy();
    for (;;) {
      const end = buffer.indexOf("\r\n");
      if (end < 0) break;
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      if (data) {
        if (line === ".") {
          messages.push(message);
          if (messages.length > 50) messages.shift();
          message = "";
          data = false;
          socket.write("250 Accepted\r\n");
        } else message += line.replace(/^\.\./, ".") + "\r\n";
      } else if (/^(EHLO|HELO)/i.test(line)) socket.write("250-localhost\r\n250 SIZE 262144\r\n");
      else if (/^(MAIL FROM|RCPT TO|RSET|NOOP)/i.test(line)) socket.write("250 OK\r\n");
      else if (/^DATA$/i.test(line)) {
        data = true;
        socket.write("354 End with dot\r\n");
      } else if (/^QUIT$/i.test(line)) socket.end("221 Bye\r\n");
      else socket.write("502 Not implemented\r\n");
    }
  });
  socket.on("error", () => {});
});
await new Promise((resolve) => smtp.listen(10252, "127.0.0.1", resolve));
const next = require("next");
const app = next({
  dev: false,
  dir: fileURLToPath(new URL("../../", import.meta.url)),
  hostname: "127.0.0.1",
  port: 3302,
});
await app.prepare();
const web = createServer(app.getRequestHandler());
await new Promise((resolve) => web.listen(3302, "127.0.0.1", resolve));
const control = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/messages") {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(messages));
  } else if (request.method === "POST" && request.url === "/shutdown") {
    response.end("Stopping test fixture");
    web.close();
    smtp.close();
    control.close();
    setImmediate(() => process.exit(0));
  } else {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => control.listen(3304, "127.0.0.1", resolve));
console.log(`Private account test fixture ready on loopback 3302; PID ${process.pid}`);
