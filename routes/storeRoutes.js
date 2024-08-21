const express = require('express');
const router = express.Router();
const { Store } = require('../models/index');
const WebSocket = require('ws');

// Create a new store
router.post('/', async (req, res) => {
  try {
    const store = await Store.create(req.body);
    
    // Notify WebSocket clients about the new store
    const clients = req.app.get('wss').clients;
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(store));
      }
    });

    res.status(201).json(store);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all stores
router.get('/', async (req, res) => {
  try {
    const stores = await Store.findAll();
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
