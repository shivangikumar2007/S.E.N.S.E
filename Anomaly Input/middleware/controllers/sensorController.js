// Default anomaly thresholds for external sensor readings.
let thresholds = {
  power: 300,
  water: 10,
  air: 100,
};

let broadcastCallback = null;
let latestReading = null;

const setBroadcastCallback = (fn) => {
  broadcastCallback = fn;
};

const getThresholds = (req, res) => {
  res.json({ success: true, thresholds });
};

const updateThresholds = (req, res) => {
  const { power, water, air } = req.body;
  if (power !== undefined) thresholds.power = Number(power);
  if (water !== undefined) thresholds.water = Number(water);
  if (air !== undefined) thresholds.air = Number(air);

  if (broadcastCallback) {
    broadcastCallback({ type: 'THRESHOLDS_UPDATED', thresholds });
  }

  res.json({ success: true, message: 'Thresholds updated successfully', thresholds });
};

const getLatestReading = (req, res) => {
  res.json({ success: true, reading: latestReading });
};

const sendLatestReading = (socket) => {
  if (latestReading && socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify({ type: 'SENSOR_READING', data: latestReading }));
  }
};

// Process telemetry from the mobile node. AQI is accepted as either `air`
// (legacy field) or `airQuality`; `floor` and `buildingId` target the S.E.N.S.E. zone.
const processSensorData = (req, res) => {
  const { power, water, air, airQuality, floor, buildingId } = req.body;
  const reading = {
    power: Number(power) || 0,
    water: Number(water) || 0,
    air: Number(airQuality ?? air) || 0,
    floor: Math.max(1, Math.min(99, Number(floor) || 2)),
    buildingId: typeof buildingId === 'string' ? buildingId : undefined,
    timestamp: new Date().toLocaleTimeString(),
  };

  const alerts = [];
  if (reading.power > thresholds.power) alerts.push(`High Power Usage: ${reading.power} kW (Limit: ${thresholds.power})`);
  if (reading.water > thresholds.water) alerts.push(`Water Spike Alert: ${reading.water} L/min (Limit: ${thresholds.water})`);
  if (reading.air > thresholds.air) alerts.push(`Poor Air Quality Alert: ${reading.air} AQI (Limit: ${thresholds.air})`);

  latestReading = reading;
  const payload = { type: 'SENSOR_READING', data: reading, alerts };
  if (broadcastCallback) broadcastCallback(payload);

  res.json({ success: true, reading, alerts });
};

module.exports = {
  getThresholds,
  updateThresholds,
  getLatestReading,
  sendLatestReading,
  processSensorData,
  setBroadcastCallback,
};
