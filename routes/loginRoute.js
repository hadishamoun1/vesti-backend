const express = require("express");
const router = express.Router();
const { User, Store } = require("../models/index");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET_KEY = process.env.SECRET_KEY;

// General login route
router.post("/", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user.id, role: user.role }, SECRET_KEY, {
      expiresIn: "7d",
    });

    return res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error during login" });
  }
});

// Store-specific login route
router.post("/store", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Check if the user exists
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // If user is not an admin, check if they are a store owner
    let store = null;
    if (user.role !== "admin") {
      store = await Store.findOne({ where: { ownerId: user.id } });

      if (!store) {
        return res.status(400).json({ message: "You are not a store owner" });
      }
    }

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role, storeId: store ? store.id : null },
      SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      store: store
        ? {
           
            id: store.id,
            name: store.name,
            location: store.location,
          }
        : null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error during login" });
  }
});

module.exports = router;
