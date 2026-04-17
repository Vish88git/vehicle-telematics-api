const pool = require("./db");

async function initDb() {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id VARCHAR(20) PRIMARY KEY,
                vehicle_id VARCHAR(20) NOT NULL,
                dtc_code VARCHAR(10),
                message TEXT,
                severity INTEGER,
                acknowledged BOOLEAN DEFAULT FALSE,
                timestamp TIMESTAMPTZ DEFAULT NOW()
            )
        `);
    console.log("Database initialised — notifications table ready");
    await pool.query(`
    CREATE TABLE IF NOT EXISTS faults (
        vehicle_id VARCHAR(20) NOT NULL,
        dtc_code VARCHAR(10) NOT NULL,
        description TEXT,
        severity INTEGER,
        resolved BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (vehicle_id, dtc_code)
    )
`);
    console.log("Faults table ready");
    const faults = [
      {
        vehicleId: "KA-01-AB-1234",
        dtcCode: "P0301",
        description: "Cylinder 1 misfire detected",
        severity: 8,
      },
      {
        vehicleId: "KA-01-AB-1234",
        dtcCode: "P0420",
        description: "Catalyst system efficiency below threshold",
        severity: 6,
      },
      {
        vehicleId: "KA-01-CD-5678",
        dtcCode: "P0A78",
        description: "Motor Electronics Coolant Temperature Sensor Circuit",
        severity: 7,
      },
      {
        vehicleId: "KA-01-CD-5678",
        dtcCode: "P0A09",
        description: "DC/DC Converter Status Circuit High",
        severity: 8,
      },
    ];

    for (const fault of faults) {
      await pool.query(
        `INSERT INTO faults (vehicle_id, dtc_code, description, severity, resolved)
         VALUES ($1, $2, $3, $4, FALSE)
         ON CONFLICT (vehicle_id, dtc_code) DO NOTHING`,
        [fault.vehicleId, fault.dtcCode, fault.description, fault.severity],
      );
    }
    console.log("Faults seeded");
    await pool.query(`
    CREATE TABLE IF NOT EXISTS telemetry_history (
        id SERIAL PRIMARY KEY,
        vehicle_id VARCHAR(20) NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        rpm INTEGER,
        speed INTEGER,
        coolant_temp INTEGER,
        engine_load INTEGER,
        fuel_level INTEGER,
        afr DECIMAL,
        iat INTEGER,
        cmv DECIMAL,
        soc INTEGER,
        soh INTEGER,
        battery_pack_temp INTEGER,
        motor_torque INTEGER,
        hv_pack_voltage INTEGER,
        motor_temp INTEGER,
        regen DECIMAL,
        aux DECIMAL,
        ins INTEGER
    )
`);
    console.log("Telemetry history table ready");
  } catch (error) {
    console.error("Database initialisation failed:", error);
  }
}

module.exports = initDb;
