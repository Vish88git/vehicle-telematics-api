const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const app = express();

app.use(
  "/api/telemetry",
  createProxyMiddleware({
    target: "http://localhost:3001",
    changeOrigin: true,
  }),
);

app.use(
  "/api/faults",
  createProxyMiddleware({
    target: "http://localhost:3002",
    changeOrigin: true,
  }),
);

app.use(
  "/api/notifications",
  createProxyMiddleware({
    target: "http://localhost:3003",
    changeOrigin: true,
  }),
);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
