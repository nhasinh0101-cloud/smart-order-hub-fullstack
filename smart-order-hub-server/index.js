const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const ordersRoutes = require('./routes/orders.routes');
const operationsRoutes = require('./routes/operations.routes');
const usersRoutes = require('./routes/users.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const assistantRoutes = require('./routes/assistant.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_order_hub';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB: smart_order_hub'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: 'smart_order_hub', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/assistant', assistantRoutes);

// In production, Express serves the Angular build so the whole application
// is available from one origin. During development Angular CLI uses proxy.conf.json.
const frontendDist = path.resolve(__dirname, '../smart-order-hub-client/dist/smart-order-hub-client/browser');
const legacyFrontendDist = path.resolve(__dirname, '../smart-order-hub-client/dist/smart-order-hub-client');
const frontendPath = require('fs').existsSync(frontendDist) ? frontendDist : legacyFrontendDist;
if (require('fs').existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
  console.log(`Serving Angular frontend from ${frontendPath}`);
}

app.listen(PORT, () => {
  console.log(`Smart Order Hub API Server running at http://localhost:${PORT}`);
});
