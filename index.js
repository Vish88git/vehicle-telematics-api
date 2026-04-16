const express = require("express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vehicle Telematics API",
      version: "1.0.0",
      description:
        "REST API for vehicle telemetry, fault management, and notifications",
    },
  },
  apis: ["./index.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const vehicleData = {
  "KA-01-AB-1234": {
    // ICE fields here
    rpm: 2500,
    speed: 80,
    coolantTemp: 90,
    engineLoad: 70,
    fuelLevel: 50,
    afr: 14.7,
    iat: 35,
    cmv: 13.8,
  },
  "KA-01-CD-5678": {
    // BEV fields here
    soc: 80,
    speed: 60,
    batteryPackTemp: 30,
    motorTorque: 150,
    hvPackVoltage: 400,
    motorTemp: 40,
    soh: 92,
    regen: 15,
    aux: 13.5,
    ins: 1200,
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

const notifications = [];

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Returns API health status
 *     responses:
 *       200:
 *         description: API is healthy
 */

app.get("/api/health", function (req, res) {
  res.status(200).json({ status: "ok" });
});

/**
 * @swagger
 * /api/telemetry/{vehicleId}:
 *   get:
 *     summary: Get latest telemetry snapshot
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle registration number
 *     responses:
 *       200:
 *         description: Telemetry data returned
 *       404:
 *         description: Vehicle not found
 */

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

/**
 * @swagger
 * /api/telemetry/{vehicleId}:
 *   post:
 *     summary: Ingest new telemetry data
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               rpm: 3500
 *               speed: 100
 *     responses:
 *       200:
 *         description: Telemetry updated
 *       404:
 *         description: Vehicle not found
 */

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

/**
 * @swagger
 * /api/telemetry/{vehicleId}/history:
 *   get:
 *     summary: Get telemetry history
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle registration number
 *     responses:
 *       200:
 *         description: Telemetry history array returned
 *       404:
 *         description: Vehicle not found
 */
app.get("/api/telemetry/:vehicleId/history", function (req, res) {
  const vehicleId = req.params.vehicleId;
  const data = vehicleData[vehicleId];

  if (!data) {
    return res.status(404).json({ error: "Vehicle not found" });
  }
  res.status(200).json(telemetryHistory[vehicleId]);
});

/**
 * @swagger
 * /api/faults/severity/{level}:
 *   get:
 *     summary: Get all faults by severity level
 *     parameters:
 *       - in: path
 *         name: level
 *         required: true
 *         schema:
 *           type: integer
 *         description: Severity level 1-10
 *     responses:
 *       200:
 *         description: Faults matching severity level
 */

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

/**
 * @swagger
 * /api/faults/{vehicleId}:
 *   get:
 *     summary: Get active fault codes
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle registration number
 *     responses:
 *       200:
 *         description: Active fault codes returned
 *       404:
 *         description: Vehicle not found
 */

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

/**
 * @swagger
 * /api/faults/{vehicleId}/{dtcCode}:
 *   get:
 *     summary: Get single fault code detail
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle registration number
 *       - in: path
 *         name: dtcCode
 *         required: true
 *         schema:
 *           type: string
 *         description: DTC fault code
 *     responses:
 *       200:
 *         description: Fault code detail returned
 *       404:
 *         description: Vehicle or fault code not found
 */

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

/**
 * @swagger
 * /api/faults/{vehicleId}/{dtcCode}/resolve:
 *   put:
 *     summary: Mark fault as resolved
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle registration number
 *       - in: path
 *         name: dtcCode
 *         required: true
 *         schema:
 *           type: string
 *         description: DTC fault code to resolve
 *     responses:
 *       200:
 *         description: Fault marked as resolved
 *       404:
 *         description: Vehicle or fault code not found
 */

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

/**
 * @swagger
 * /api/faults/{vehicleId}/scan:
 *   post:
 *     summary: Trigger diagnostic scan
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle registration number
 *     responses:
 *       201:
 *         description: New fault detected and added
 *       404:
 *         description: Vehicle not found
 */

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

/**
 * @swagger
 * /api/notifications/critical:
 *   post:
 *     summary: Trigger critical fault notification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               vehicleId: KA-01-AB-1234
 *               dtcCode: P0301
 *               message: Critical fault detected - immediate attention required
 *     responses:
 *       201:
 *         description: Notification created
 */

app.post("/api/notifications/critical", function (req, res) {
  const { vehicleId, dtcCode, message } = req.body;

  // Get severity from faultData if exists
  const faults = faultData[vehicleId];
  const fault = faults && faults[dtcCode];
  const severity = fault ? fault.severity : 10;

  const notification = {
    id: Date.now().toString(), // Simple unique ID
    vehicleId,
    dtcCode,
    message,
    severity,
    acknowledged: false,
    timestamp: new Date().toISOString(),
  };

  notifications.push(notification);
  res.status(201).json(notification);
});

/**
 * @swagger
 * /api/notifications/{vehicleId}:
 *   get:
 *     summary: Get all notifications for a vehicle
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle registration number
 *     responses:
 *       200:
 *         description: Notifications array returned
 */

app.get("/api/notifications/:vehicleId", function (req, res) {
  const vehicleId = req.params.vehicleId;
  const matching = notifications.filter((n) => n.vehicleId === vehicleId);
  res.status(200).json(matching);
});

/**
 * @swagger
 * /api/notifications/{id}/acknowledge:
 *   put:
 *     summary: Acknowledge a notification
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification acknowledged
 *       404:
 *         description: Notification not found
 */

app.put("/api/notifications/:id/acknowledge", function (req, res) {
  const id = req.params.id;
  const notification = notifications.find((n) => n.id === id);

  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }

  notification.acknowledged = true;
  res.status(200).json(notification);
});

/**
 * @swagger
 * /api/telemetry/{vehicleId}/stream:
 *   get:
 *     summary: Live telemetry stream
 *     description: Server-sent events stream pushing telemetry every 2 seconds
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle registration number
 *     responses:
 *       200:
 *         description: SSE stream started
 *       404:
 *         description: Vehicle not found
 */

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
