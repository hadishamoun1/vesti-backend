const express = require("express");
const router = express.Router();
const { Discount, Notification } = require("../models/index");
const { Op } = require("sequelize");

// Create a new discount
router.post("/", async (req, res) => {
  try {
    const discount = await Discount.create(req.body);
    res.status(201).json(discount);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all discounts
router.get("/", async (req, res) => {
  try {
    const discounts = await Discount.findAll();
    res.json(discounts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a discount by ID
router.put("/:id", async (req, res) => {
  try {
    const discount = await Discount.findByPk(req.params.id);
    if (discount) {
      await discount.update(req.body);
      res.json(discount);
    } else {
      res.status(404).json({ error: "Discount not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a discount by ID
router.delete("/:id", async (req, res) => {
  try {
    const discount = await Discount.findByPk(req.params.id);
    if (discount) {
      await discount.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: "Discount not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Fetch active discounts based on storeId
router.get("/active", async (req, res) => {
  const { storeId } = req.query;

  if (!storeId) {
    return res.status(400).json({ message: "storeId is required" });
  }

  try {
    const discounts = await Discount.findAll({
      where: {
        storeId: storeId,
        active: true,
      },
    });

    if (discounts.length === 0) {
      return res.status(404).json({ message: "No active discounts found" });
    }

    res.json(discounts);
  } catch (error) {
    console.error("Error fetching active discounts:", error);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/disable", async (req, res) => {
  const { discountId } = req.body;

  if (!discountId) {
    return res.status(400).json({ message: "Discount ID is required" });
  }

  try {
    // Find the discount
    const discount = await Discount.findByPk(discountId);

    if (!discount) {
      return res.status(404).json({ message: "Discount not found" });
    }

    // Update the discount to inactive
    await discount.update({ active: false });

    // Delete related notifications
    await Notification.destroy({
      where: { discountId: discountId },
    });

    res.status(200).json({
      message: "Discount disabled and notifications removed successfully",
    });
  } catch (error) {
    console.error("Error disabling discount:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/history", async (req, res) => {
  const { storeId } = req.query;

  if (!storeId) {
    return res.status(400).json({ message: "storeId is required" });
  }

  try {
    const discounts = await Discount.findAll({
      where: {
        storeId: storeId,
        active: false,
      },
    });

    if (discounts.length === 0) {
      return res.status(404).json({ message: "No active discounts found" });
    }

    res.json(discounts);
  } catch (error) {
    console.error("Error fetching active discounts:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
