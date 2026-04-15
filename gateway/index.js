const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimit = require("express-rate-limit");

const app = express();
const API_KEY = "telematics-secret-key-2024";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later" },
});

function authCheck(req, res, next) {
  const key = req.headers["x-api-key"];
  console.log("Auth check - key:", key);
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.use(limiter);

app.use(
  "/api/telemetry",
  authCheck,
  createProxyMiddleware({
    target: "http://telemetry-service:3001",
    changeOrigin: true,
  }),
);

app.use(
  "/api/faults",
  authCheck,
  createProxyMiddleware({
    target: "http://fault-service:3002",
    changeOrigin: true,
  }),
);

app.use(
  "/api/notifications",
  authCheck,
  createProxyMiddleware({
    target: "http://notification-service:3003",
    changeOrigin: true,
  }),
);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
