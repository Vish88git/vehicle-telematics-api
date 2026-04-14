const express = require("express");
const app = express();
app.use(express.json());

const vehicleData = {
  "KA-01-AB-1234": {
    rpm: 2500,
    speed: 80,
    coolantTemp: 90,
    engineLoad: 70,
    fuelLevel: 50,
    afr: 14.7,
  },
  "KA-01-CD-5678": {
    soc: 80,
    speed: 60,
    batteryPackTemp: 30,
    motorTorque: 150,
    hvPackVoltage: 400,
    motorTemp: 40,
  },
};

const telemetryHistory = {
  "KA-01-AB-1234": [],
  "KA-01-CD-5678": [],
};

// API endpoint
app.get("/api/telemetry/:vehicleId", function (req, res) {
  const vehicleId = req.params.vehicleId;
  const data = vehicleData[vehicleId];

  if (data) {
    res.status(200).json(data);
  } else {
    res.status(404).json({ error: "vehicle not found" });
  }
});

app.post("/api/telemetry/:vehicleId", function (req, res) {
  const vehicleId = req.params.vehicleId;
  const data = vehicleData[vehicleId];

  if (!data) {
    return res.status(404).json({ error: "Vehicle not found" });
  }
  Object.assign(data, req.body);
  const snapshot = {
    timestamp: new Date().toISOString(),
    ...data,
  };
  telemetryHistory[vehicleId].push(snapshot);
  res.status(200).json(data);
});

app.get("/api/telemetry/:vehicleId/history", function (req, res) {
  const vehicleId = req.params.vehicleId;
  const data = vehicleData[vehicleId];

  if (!data) {
    return res.status(404).json({ error: "Vehicle not found" });
  }
  res.status(200).json(telemetryHistory[vehicleId]);
});

app.get("/api/telemetry/:vehicleId/stream", function (req, res) {
  // 1. Extract vehicleId
  const vehicleId = req.params.vehicleId;
  const data = vehicleData[vehicleId];

  // 2. Check if vehicle exists
  if (!data) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  // 3. Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Optional but commonly used
  res.flushHeaders();

  // 4. Send initial data immediately
  res.write(`data: ${JSON.stringify(data)}\n\n`);

  // 5. Send updated data every 2 seconds
  const interval = setInterval(function () {
    const updatedData = vehicleData[vehicleId];

    res.write(`data: ${JSON.stringify(updatedData)}\n\n`);
  }, 2000);

  // 6. Stop interval when client disconnects
  req.on("close", function () {
    clearInterval(interval);
    res.end();
  });
});

const PORT = 3001;
app.listen(PORT, function () {
  console.log(`Telemetry Service running on port ${PORT}`);
});
