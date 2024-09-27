const express = require("express");
const router = express.Router();
const { User } = require("../models/index");
const sequelize = require("../connection/connection");
const bcrypt = require("bcrypt");

// Create a new user
router.post("/", async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
    });

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating user");
  }
});

// Get a user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



router.put("/:id", async (req, res) => {
  const { name, email, phoneNumber, password } = req.body;

  try {
    const user = await User.findByPk(req.params.id);
    
    if (user) {
     
      const updatedData = {
        name: name || user.name,
        email: email || user.email,
        phoneNumber: phoneNumber || user.phoneNumber, 
      };

      
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updatedData.password = hashedPassword;
      }

     
      await user.update(updatedData);

      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a user by ID
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      await user.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


module.exports = router;
