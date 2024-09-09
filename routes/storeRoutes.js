const express = require("express");
const router = express.Router();
const { Store } = require("../models/index");
const WebSocket = require("ws");
const { Op, fn, col, literal } = require("sequelize");
const sequelize = require("../connection/connection");
const authMiddleware = require('../middleware/authMiddleware');

const RADIUS_IN_METERS = 50; // Define the radius for nearby stores (e.g., 5 km)

// Create a new store
router.post("/", authMiddleware,async (req, res) => {
  try {
    const store = await Store.create(req.body);

    // Notify WebSocket clients about the new store
    const wss = req.app.get("wss"); // Access WebSocket server
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(store));
      }
    });

    res.status(201).json(store);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all stores with optional limit
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || null; // Default to null if not provided
    const stores = limit
      ? await Store.findAll({ limit })
      : await Store.findAll();
    res.json(stores);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lon, limit } = req.query;

    if (!lat || !lon) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const limitValue = parseInt(limit, 10) || 10; // Defaults to 10 if not provided
    const radius = parseFloat(req.query.radius); // Defaults to 5000 if not provided

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: "Invalid latitude or longitude" });
    }

    if (isNaN(limitValue)) {
      return res.status(400).json({ error: "Limit must be a number" });
    }

    if (isNaN(radius)) {
      return res.status(400).json({ error: "Radius must be a number" });
    }

    // Log the bind parameters for debugging
    console.log("Query Parameters:", [longitude, latitude, radius, limitValue]);

    const query = `
      SELECT id, name, 
             ST_Distance(
               ST_SetSRID(ST_GeomFromGeoJSON(location::jsonb), 4326)::geography,
               ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
             ) AS distance
      FROM stores
      WHERE ST_Distance(
               ST_SetSRID(ST_GeomFromGeoJSON(location::jsonb), 4326)::geography,
               ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
             ) < $3
      ORDER BY distance
      LIMIT $4;
    `;

    const stores = await sequelize.query(query, {
      bind: [longitude, latitude, radius, limitValue],
      type: sequelize.QueryTypes.SELECT,
    });

    res.json(stores);
  } catch (error) {
    console.error("Error executing query:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Get a store by ID
router.get("/:id", async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (store) {
      res.json(store);
    } else {
      res.status(404).json({ error: "Store not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a store by ID
router.put("/:id", async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (store) {
      await store.update(req.body);
      res.json(store);
    } else {
      res.status(404).json({ error: "Store not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a store by ID
router.delete("/:id", async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (store) {
      await store.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: "Store not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
