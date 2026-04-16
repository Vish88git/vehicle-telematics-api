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
  } catch (error) {
    console.error("Database initialisation failed:", error);
  }
}

module.exports = initDb;
