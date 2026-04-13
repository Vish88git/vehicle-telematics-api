const express = require("express");
const app = express();
app.use(express.json());

const vehicleData = {
  "KA-01-AB-1234": {
    // ICE fields here
    rpm: 2500,
    speed: 80,
    coolantTemp: 90,
    engineLoad: 70,
    fuelLevel: 50,
    afr: 14.7,
  },
  "KA-01-CD-5678": {
    // BEV fields here
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

app.get("/api/health", function (req, res) {
  res.status(200).json({ status: "ok" });
});

// GET /api/telemetry/:vehicleId — Latest telemetry snapshot
app.get("/api/telemetry/:vehicleId", function (req, res) {
  const vehicleId = req.params.vehicleId;
  const data = vehicleData[vehicleId];

  if (data) {
    res.status(200).json(data);
  } else {
    res.status(404).json({ error: "Vehicle not found" });
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

const PORT = 3000;
app.listen(PORT, function () {
  console.log(`Server is running on port ${PORT}`);
});
