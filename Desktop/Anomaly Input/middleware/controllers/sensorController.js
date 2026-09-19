// Default threshold values
let thresholds = {
  power: 300, // Max kWh
  water: 10,  // Max L/min
  air: 100    // Max AQI
};

let broadcastCallback = null;

const setBroadcastCallback = (fn) => {
  broadcastCallback = fn;
};

// Get current thresholds
const getThresholds = (req, res) => {
  res.json({ success: true, thresholds });
};

// Update thresholds from Laptop Dashboard
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

// Process Manual Sensor Data from Phone Client
const processSensorData = (req, res) => {
  const { power, water, air } = req.body;

  const reading = {
    power: Number(power) || 0,
    water: Number(water) || 0,
    air: Number(air) || 0,
    timestamp: new Date().toLocaleTimeString()
  };

  // Anomaly Engine: Compare with threshold values
  let alerts = [];
  if (reading.power > thresholds.power) {
    alerts.push(`⚠️ High Power Usage: ${reading.power} kWh (Limit: ${thresholds.power})`);
  }
  if (reading.water > thresholds.water) {
    alerts.push(`🚨 Water Spike Alert: ${reading.water} L/min (Limit: ${thresholds.water})`);
  }
  if (reading.air > thresholds.air) {
    alerts.push(`🌫️ Poor Air Quality Alert: ${reading.air} AQI (Limit: ${thresholds.air})`);
  }

  const payload = {
    type: 'SENSOR_READING',
    data: reading,
    alerts: alerts
  };

  if (broadcastCallback) {
    broadcastCallback(payload);
  }

  res.json({ success: true, reading, alerts });
};

module.exports = {
  getThresholds,
  updateThresholds,
  processSensorData,
  setBroadcastCallback
};