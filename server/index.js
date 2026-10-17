/**
 * index.js - Express API Server Entry Point
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database init & seed
const { seedIfEmpty } = require('./src/db/seed');
seedIfEmpty();

// Static uploads folder
const fs = require('fs');
const uploadDir = path.join(__dirname, 'data/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/expenses', require('./src/routes/expenses'));
app.use('/api/metrics', require('./src/routes/metrics'));
app.use('/api/upload', require('./src/routes/upload'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('/api/{*path}', (req, res) => {
  res.status(404).json({ error: 'Endpoint không tồn tại' });
});

app.listen(PORT, () => {
  console.log(`🌸 FlowerShop API Server running at http://localhost:${PORT}`);
  console.log(`📊 API Docs: http://localhost:${PORT}/api/health`);
});
