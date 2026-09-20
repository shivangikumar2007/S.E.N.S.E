const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Rate Limiter Firewall Middleware (Prevents DDoS and brute-force attacks)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: { error: 'Too many requests from this IP, firewall blocked access.' }
});

const applyFirewall = (app) => {
  // Helmet applies security headers
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use('/api/', apiLimiter);
};

module.exports = applyFirewall;