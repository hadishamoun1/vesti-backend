const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const WebSocket = require("ws");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const path = require("path");

// Import routes
const userRoutes = require("./routes/userRoutes");
const storeRoutes = require("./routes/storeRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const orderItemRoutes = require("./routes/orderItemRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const discountRoutes = require("./routes/discountRoutes");
const storeCategoryRoutes = require("./routes/storeCategoryRoutes");
const loginRoutes = require("./routes/loginRoute");
const signupRoutes = require("./routes/SignupRoute");

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Apply middlewares
app.use(bodyParser.json());

app.use(
  cors({
    origin: "http://localhost:3001", // Replace with your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Secure HTTP headers with helmet, but allow specific cross-origin resource policies
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allow cross-origin resources
  })
);

// Limit requests to avoid DOS attacks
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);

// Use routes
app.use("/users", userRoutes);
app.use("/stores", storeRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/order-items", orderItemRoutes);
app.use("/notifications", notificationRoutes);
app.use("/discounts", discountRoutes);
app.use("/store-categories", storeCategoryRoutes);
app.use("/login", loginRoutes);
app.use("/signup", signupRoutes);

// Serve static files from /uploads with appropriate CORS headers
app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3001");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Cross-Origin-Resource-Policy", "cross-origin"); // Allow cross-origin resource sharing for images
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// WebSocket connection handling
wss.on("connection", (ws, req) => {
  console.log("Client connected");

  // Handle incoming messages from clients
  ws.on("message", (message) => {
    console.log(`Received message => ${message}`);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
});

// Graceful shutdown
server.on("close", async () => {
  const { sequelize } = require("./models"); // Adjust path as necessary
  await sequelize.close();
  console.log("Database connection closed");
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
