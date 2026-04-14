const express = require("express");
const app = express();
app.use(express.json());

const notifications = [];

app.post("/api/notifications/critical", function (req, res) {
  const { vehicleId, dtcCode, message } = req.body;

  // Get severity from faultData if exists
  const severity = 10;

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

app.get("/api/notifications/:vehicleId", function (req, res) {
  const vehicleId = req.params.vehicleId;
  const matching = notifications.filter((n) => n.vehicleId === vehicleId);
  res.status(200).json(matching);
});

app.put("/api/notifications/:id/acknowledge", function (req, res) {
  const id = req.params.id;
  const notification = notifications.find((n) => n.id === id);

  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }

  notification.acknowledged = true;
  res.status(200).json(notification);
});

const port = 3003;
app.listen(port, function () {
  console.log(`Notification Service running on port ${port}`);
});
