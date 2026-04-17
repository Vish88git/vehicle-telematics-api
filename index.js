const express = require("express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const pool = require("./db");
const initDb = require("./initDb");

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

app.post("/api/telemetry/:vehicleId", async function (req, res) {
  const vehicleId = req.params.vehicleId;
  const data = vehicleData[vehicleId];

  if (!data) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  Object.assign(data, req.body);

  try {
    await pool.query(
      `INSERT INTO telemetry_history 
       (vehicle_id, rpm, speed, coolant_temp, engine_load, fuel_level, afr, iat, cmv,
        soc, soh, battery_pack_temp, motor_torque, hv_pack_voltage, motor_temp, regen, aux, ins)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        vehicleId,
        data.rpm || null,
        data.speed || null,
        data.coolantTemp || null,
        data.engineLoad || null,
        data.fuelLevel || null,
        data.afr || null,
        data.iat || null,
        data.cmv || null,
        data.soc || null,
        data.soh || null,
        data.batteryPackTemp || null,
        data.motorTorque || null,
        data.hvPackVoltage || null,
        data.motorTemp || null,
        data.regen || null,
        data.aux || null,
        data.ins || null,
      ],
    );
  } catch (error) {
    console.error("DB error saving telemetry:", error);
  }

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
app.get("/api/telemetry/:vehicleId/history", async function (req, res) {
  const vehicleId = req.params.vehicleId;
  const data = vehicleData[vehicleId];

  if (!data) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM telemetry_history
       WHERE vehicle_id = $1
       ORDER BY timestamp DESC
       LIMIT 100`,
      [vehicleId],
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("DB error:", error);
    res.status(500).json({ error: "Failed to fetch telemetry history" });
  }
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

app.get("/api/faults/severity/:level", async function (req, res) {
  const level = parseInt(req.params.level);

  try {
    const result = await pool.query(
      `SELECT vehicle_id AS "vehicleId", dtc_code AS "dtcCode", 
              description, severity, resolved
       FROM faults
       WHERE severity = $1`,
      [level],
    );

    const grouped = {};
    result.rows.forEach((row) => {
      if (!grouped[row.vehicleId]) {
        grouped[row.vehicleId] = {};
      }
      grouped[row.vehicleId][row.dtcCode] = {
        description: row.description,
        severity: row.severity,
        resolved: row.resolved,
      };
    });

    res.status(200).json(grouped);
  } catch (error) {
    console.error("DB error:", error);
    res.status(500).json({ error: "Failed to fetch faults by severity" });
  }
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

app.get("/api/faults/:vehicleId", async function (req, res) {
  const vehicleId = req.params.vehicleId;

  try {
    const result = await pool.query(
      `SELECT dtc_code AS "dtcCode", description, severity, resolved
       FROM faults
       WHERE vehicle_id = $1 AND resolved = FALSE`,
      [vehicleId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    const faults = {};
    result.rows.forEach((row) => {
      faults[row.dtcCode] = {
        description: row.description,
        severity: row.severity,
        resolved: row.resolved,
      };
    });

    res.status(200).json(faults);
  } catch (error) {
    console.error("DB error:", error);
    res.status(500).json({ error: "Failed to fetch faults" });
  }
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

app.get("/api/faults/:vehicleId/:dtcCode", async function (req, res) {
  const { vehicleId, dtcCode } = req.params;

  try {
    const result = await pool.query(
      `SELECT dtc_code AS "dtcCode", description, severity, resolved
       FROM faults
       WHERE vehicle_id = $1 AND dtc_code = $2`,
      [vehicleId, dtcCode],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Fault code not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("DB error:", error);
    res.status(500).json({ error: "Failed to fetch fault" });
  }
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

app.put("/api/faults/:vehicleId/:dtcCode/resolve", async function (req, res) {
  const { vehicleId, dtcCode } = req.params;

  try {
    const result = await pool.query(
      `UPDATE faults
       SET resolved = TRUE
       WHERE vehicle_id = $1 AND dtc_code = $2
       RETURNING dtc_code AS "dtcCode", description, severity, resolved`,
      [vehicleId, dtcCode],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Fault code not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("DB error:", error);
    res.status(500).json({ error: "Failed to resolve fault" });
  }
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
    app.post("/api/faults/:vehicleId/scan", async function (req, res) {
      const vehicleId = req.params.vehicleId;
      const availableFaults = scanFaults[vehicleId];

      if (!availableFaults) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      const keys = Object.keys(availableFaults);
      const randomCode = keys[Math.floor(Math.random() * keys.length)];
      const newFault = availableFaults[randomCode];

      try {
        await pool.query(
          `INSERT INTO faults (vehicle_id, dtc_code, description, severity, resolved)
       VALUES ($1, $2, $3, $4, FALSE)
       ON CONFLICT (vehicle_id, dtc_code) DO NOTHING`,
          [vehicleId, randomCode, newFault.description, newFault.severity],
        );

        res.status(201).json({
          code: randomCode,
          description: newFault.description,
          severity: newFault.severity,
          resolved: false,
        });
      } catch (error) {
        console.error("DB error:", error);
        res.status(500).json({ error: "Failed to save scanned fault" });
      }
    });
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

app.post("/api/notifications/critical", async function (req, res) {
  const { vehicleId, dtcCode, message } = req.body;
  const severity = 10;
  const id = Date.now().toString();
  const timestamp = new Date().toISOString();

  try {
    await pool.query(
      `INSERT INTO notifications (id, vehicle_id, dtc_code, message, severity, acknowledged, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, vehicleId, dtcCode, message, severity, false, timestamp],
    );

    res.status(201).json({
      id,
      vehicleId,
      dtcCode,
      message,
      severity,
      acknowledged: false,
      timestamp,
    });
  } catch (error) {
    console.error("DB error:", error);
    res.status(500).json({ error: "Failed to save notification" });
  }
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

app.get("/api/notifications/:vehicleId", async function (req, res) {
  const vehicleId = req.params.vehicleId;

  try {
    const result = await pool.query(
      `SELECT id, vehicle_id AS "vehicleId", dtc_code AS "dtcCode", 
              message, severity, acknowledged, timestamp
       FROM notifications
       WHERE vehicle_id = $1
       ORDER BY timestamp DESC`,
      [vehicleId],
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("DB error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
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

app.put("/api/notifications/:id/acknowledge", async function (req, res) {
  const id = req.params.id;

  try {
    const result = await pool.query(
      `UPDATE notifications 
       SET acknowledged = TRUE 
       WHERE id = $1
       RETURNING id, vehicle_id AS "vehicleId", dtc_code AS "dtcCode",
                 message, severity, acknowledged, timestamp`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("DB error:", error);
    res.status(500).json({ error: "Failed to acknowledge notification" });
  }
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
app.listen(PORT, async function () {
  await initDb();
  console.log(`Server is running on port ${PORT}`);
});
