const express = require("express");
const router = express.Router();
const { Notification } = require("../models/index");
const admin = require("firebase-admin");
// Create a new notification
router.post("/", async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all notifications
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.findAll();
    res.json(notifications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a notification by ID
router.get("/:id", async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (notification) {
      res.json(notification);
    } else {
      res.status(404).json({ error: "Notification not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a notification by ID
router.put("/:id", async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (notification) {
      await notification.update(req.body);
      res.json(notification);
    } else {
      res.status(404).json({ error: "Notification not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a notification by ID
router.delete("/:id", async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (notification) {
      await notification.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: "Notification not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const serviceAccount = require("../vesti-34f84-firebase-adminsdk-rwiem-2f7e707d88.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});



router.post("/send-notification", async (req, res) => {
  const { title, body, storeId } = req.body;

  console.log("Notification request received:", { title, body});

  try {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      topic: "nearby_stores",
    };

    console.log("Sending message:", message);

    await admin.messaging().send(message);
    console.log("Notification sent successfully");

    res
      .status(200)
      .json({ success: true, message: "Notification sent successfully" });
  } catch (error) {
    console.error("Error sending notification:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to send notification",
        error: error.message,
      });
  }
});

module.exports = router;
