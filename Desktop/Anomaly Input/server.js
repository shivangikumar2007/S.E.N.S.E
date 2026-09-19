const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

const applyFirewall = require('./middleware/securityFirewall');
const { generateToken, authenticateJWT } = require('./middleware/auth');
const sensorController = require('./middleware/controllers/sensorController');

const app = express();
app.use(cors());
app.use(express.json());

// Apply Security Firewall & Rate Limiting
applyFirewall(app);

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'middleware', 'controllers', 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let connectedClients = [];

// WebSocket Server Connection logic
wss.on('connection', (ws) => {
  connectedClients.push(ws);

  // Send current thresholds to connected laptop dashboard
  ws.send(JSON.stringify({
    type: 'THRESHOLDS_UPDATED',
    thresholds: sensorController.thresholds || { power: 300, water: 10, air: 100 }
  }));

  ws.on('close', () => {
    connectedClients = connectedClients.filter(client => client !== ws);
  });
});

// Broadcast payload to all dashboard WebSocket clients
const broadcast = (data) => {
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

sensorController.setBroadcastCallback(broadcast);

// --- REST API ROUTES ---

// Auth Route
app.post('/api/login', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  // Dummy Auth User for Hackathon Demo
  const token = generateToken({ id: 1, username, role: role || 'Community Manager' });
  res.json({ success: true, token, role: role || 'Community Manager' });
});

// Threshold Management
app.get('/api/thresholds', sensorController.getThresholds);
app.post('/api/thresholds', sensorController.updateThresholds);

// Phone Sensor Data Route
app.post('/api/sensor-data', sensorController.processSensorData);

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 S.E.N.S.E. Smart Resource Server running on Port ${PORT}`);
  console.log(`🔒 Security Firewall Activated (Helmet + Rate Limiter)`);
  console.log(`💻 Laptop Dashboard: http://localhost:${PORT}`);
  console.log(`📱 Phone Client: http://<YOUR_LOCAL_IP>:${PORT}/phone.html`);
  console.log(`======================================================\n`);
});