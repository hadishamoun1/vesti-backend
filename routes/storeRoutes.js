const express = require('express');
const router = express.Router();
const { Store } = require('../models/index');
const WebSocket = require('ws');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');

const RADIUS_IN_METERS = 5000; // Define the radius for nearby stores (e.g., 5 km)

// Create a new store
router.post('/', async (req, res) => {
  try {
    const store = await Store.create(req.body);
    
    // Notify WebSocket clients about the new store
    const wss = req.app.get('wss'); // Access WebSocket server
    wss.clients.forEach(client => {
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
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || null; // Default to null if not provided
    const stores = limit ? await Store.findAll({ limit }) : await Store.findAll();
    res.json(stores);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get nearby stores based on user's location
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lon, limit } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const stores = await Store.findAll({
      where: Sequelize.where(
        Sequelize.fn('ST_Distance',
          Sequelize.col('location'),
          Sequelize.fn('ST_MakePoint', lon, lat)
        ),
        { [Op.lt]: RADIUS_IN_METERS }
      ),
      limit: parseInt(limit, 10) || 10 // Default to 10 stores if not provided
    });

    res.json(stores);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a store by ID
router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (store) {
      res.json(store);
    } else {
      res.status(404).json({ error: 'Store not found' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a store by ID
router.put('/:id', async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (store) {
      await store.update(req.body);
      res.json(store);
    } else {
      res.status(404).json({ error: 'Store not found' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a store by ID
router.delete('/:id', async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (store) {
      await store.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Store not found' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
