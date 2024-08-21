const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const WebSocket = require('ws');

// Import routes
const userRoutes = require('./routes/userRoutes');
const storeRoutes = require('./routes/storeRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const orderItemRoutes = require('./routes/orderItemRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const discountRoutes = require('./routes/discountRoutes');
const storeCategoryRoutes = require('./routes/storeCategoryRoutes');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Make the WebSocket server accessible to route handlers
app.set('wss', wss);

app.use(bodyParser.json());

// Use routes
app.use('/users', userRoutes);
app.use('/stores', storeRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/order-items', orderItemRoutes);
app.use('/notifications', notificationRoutes);
app.use('/discounts', discountRoutes);
app.use('/store-categories', storeCategoryRoutes);

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Handle incoming messages from clients (optional)
  ws.on('message', (message) => {
    console.log(`Received message => ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
