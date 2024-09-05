const express = require("express");
const router = express.Router();
const { User } = require("../models/index");
const bcrypt = require("bcrypt"); 


router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

  
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    return res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error during login" });
  }
});

module.exports = router;
