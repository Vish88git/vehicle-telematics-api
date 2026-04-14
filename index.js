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

const faultData = {
  "KA-01-AB-1234": {
    P0301: {
      description: "Cylinder 1 misfire detected",
      severity: 8,
      resolved: false,
    },
    P0420: {
      description: "Catalyst system efficiency below threshold",
      severity: 6,
      resolved: false,
    },
  },
  "KA-01-CD-5678": {
    P0A78: {
      description: "Motor Electronics Coolant Temperature Sensor Circuit",
      severity: 7,
      resolved: false,
    },
    P0A09: {
      description: "DC/DC Converter Status Circuit High",
      severity: 8,
      resolved: false,
    },
  },
};

const scanFaults = {
  "KA-01-AB-1234": {
    P0302: {
      description: "Cylinder 2 misfire detected",
      severity: 8,
      resolved: false,
    },
    P0171: {
      description: "System Too Lean (Bank 1)",
      severity: 7,
      resolved: false,
    },
  },
  "KA-01-CD-5678": {
    P0A80: {
      description: "Replace Hybrid Battery Pack",
      severity: 9,
      resolved: false,
    },
    P0B00: {
      description: "Auxiliary Transmission Fluid Pump Motor Control Module",
      severity: 6,
      resolved: false,
    },
  },
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

app.get("/api/faults/severity/:level", function (req, res) {
  const level = parseInt(req.params.level);
  const result = {};

  for (const [vehicleId, faults] of Object.entries(faultData)) {
    const matchingFaults = Object.fromEntries(
      Object.entries(faults).filter(
        ([code, fault]) => fault.severity === level,
      ),
    );
    if (Object.keys(matchingFaults).length > 0) {
      result[vehicleId] = matchingFaults;
    }
  }

  res.status(200).json(result);
});

app.get("/api/faults/:vehicleId", function (req, res) {
  const vehicleId = req.params.vehicleId;
  const faults = faultData[vehicleId];

  if (!faults) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const activeFaults = Object.fromEntries(
    Object.entries(faults).filter(([code, fault]) => !fault.resolved),
  );

  res.status(200).json(activeFaults);
});

app.get("/api/faults/:vehicleId/:dtcCode", function (req, res) {
  const { vehicleId, dtcCode } = req.params;
  const faults = faultData[vehicleId];

  if (!faults) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const fault = faults[dtcCode];

  if (!fault) {
    return res.status(404).json({ error: "Fault code not found" });
  }

  res.status(200).json(fault);
});

app.put("/api/faults/:vehicleId/:dtcCode/resolve", function (req, res) {
  const { vehicleId, dtcCode } = req.params;
  const faults = faultData[vehicleId];

  if (!faults) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const fault = faults[dtcCode];

  if (!fault) {
    return res.status(404).json({ error: "Fault code not found" });
  }

  fault.resolved = true;
  res.status(200).json(fault);
});

app.post("/api/faults/:vehicleId/scan", function (req, res) {
  const vehicleId = req.params.vehicleId;
  const faults = faultData[vehicleId];
  const availableFaults = scanFaults[vehicleId];

  if (!availableFaults) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const keys = Object.keys(availableFaults);
  const randomCode = keys[Math.floor(Math.random() * keys.length)];
  const newFault = { ...availableFaults[randomCode] };

  // Add to faultData
  if (!faults) {
    faultData[vehicleId] = {};
  }
  faultData[vehicleId][randomCode] = newFault;

  res.status(201).json({ code: randomCode, ...newFault });
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

const PORT = 3000;
app.listen(PORT, function () {
  console.log(`Server is running on port ${PORT}`);
});
