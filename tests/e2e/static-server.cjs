const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "static");
const index = path.join(root, "e2e_stub.html");
const port = process.env.E2E_STATIC_PORT || 3000;

const server = http.createServer((req, res) => {
  // Provide a small config endpoint so the SPA stub can discover the
  // mock API base URL at runtime. This keeps the stub independent of
  // the runner's process env and allows flexible mock ports.
  if (req.url === "/config.json") {
    const mockPort =
      process.env.E2E_MOCK_PORT || process.env.MOCK_API_PORT || 8010;
    const payload = JSON.stringify({
      mockBase: `http://localhost:${mockPort}`,
    });
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    });
    return res.end(payload);
  }

  // serve the index for any other path (SPA style)
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  fs.createReadStream(index).pipe(res);
});

server.listen(port, () => {
  console.log(`Static E2E stub server listening on http://localhost:${port}`);
});

// graceful shutdown
process.on("SIGINT", () => server.close());
process.on("SIGTERM", () => server.close());
