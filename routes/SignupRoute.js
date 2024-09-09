const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Store = require('../models/Store');

const router = express.Router();

// Signup route
router.post('/signup', async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
    });

    // Create a store with the new user's ID
    const store = await Store.create({
      name: `${name}`, 
      ownerId: user.id,
    });

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    // Send response
    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
      store: {
        id: store.id,
        name: store.name,
        ownerId: store.ownerId,
      },
      token,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
