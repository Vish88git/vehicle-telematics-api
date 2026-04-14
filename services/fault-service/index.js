const express = require("express");
const app = express();
app.use(express.json());

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

const PORT = 3002;
app.listen(PORT, function () {
  console.log(`Fault Service running on port ${PORT}`);
});
