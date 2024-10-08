const express = require("express");
const router = express.Router();
const { User } = require("../models/index");

// Route to get all users with the role 'user'
router.get("/allusers", async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: "user" },
      attributes: ["id", "name", "email", "phoneNumber", "password"],
    });

    // Hash the password for each user (not recommended in real-world scenarios)
    const usersWithHashedPasswords = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      password: user.password,
    }));

    res.status(200).json(usersWithHashedPasswords);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
});
module.exports = router;
