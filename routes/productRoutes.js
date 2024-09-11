const express = require("express");
const router = express.Router();
const path = require("path");
const { Product, Discount, User, Notification } = require("../models/index");
const multer = require("multer");

// Set up storage for the product images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "productImages/"); // Folder where images will be saved
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Save file with unique name
  },
});

// Initialize multer with storage configuration
const upload = multer({ storage: storage });

// Route to create a new product with an image upload
router.post("/create", upload.single("picture"), async (req, res) => {
  try {
    console.log("Request File:", req.file); // Check if file is received
    console.log("Request Body:", req.body); // Check if body data is received

    const {
      storeId,
      name,
      description,
      price,
      category,
      availableColors,
      availableSizes,
    } = req.body;

    if (!name || !description || !price || !category || !storeId) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const colors = availableColors ? availableColors.split(",") : [];
    const sizes = availableSizes ? availableSizes.split(",") : [];

    const imageUrl = req.file ? `/productImages/${req.file.filename}` : null;

    const product = await Product.create({
      storeId: parseInt(storeId, 10),
      name,
      description,
      price,
      category,
      imageUrl,
      availableColors: colors,
      availableSizes: sizes,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get products by category
router.get("/category/:categoryName", async (req, res) => {
  try {
    const { categoryName } = req.params;
    const products = await Product.findAll({
      where: { category: categoryName },
    });
    res.json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// Get products by category and storeId
router.get("/category", async (req, res) => {
  try {
    const { category, storeId } = req.query;
    const products = await Product.findAll({
      where: {
        category: category,
        storeId: storeId,
      },
    });

    // Ensure that products is an array
    res.json(Array.isArray(products) ? products : []);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a product by ID
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (product) {
      await product.update(req.body);
      res.json(product);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a product by ID
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (product) {
      await product.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get products by storeId
router.get("/store/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const products = await Product.findAll({
      where: { storeId: storeId },
    });
    if (products.length > 0) {
      res.json(products);
    } else {
      res.status(404).json({ error: "No products found for this store" });
    }
  } catch (error) {
    console.error("Error fetching products by storeId:", error);
    res.status(400).json({ error: error.message });
  }
});

// Route to get products by storeId
router.get("/products/:storeId", async (req, res) => {
  const { storeId } = req.params;

  try {
    const products = await Product.findAll({ where: { storeId } });
    res.json(products);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching products." });
  }
});

router.post("/discounts/update", async (req, res) => {
  try {
    const { storeId, itemId, discount } = req.body;

    if (!storeId || !itemId || discount === undefined) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Update the product's discount
    const product = await Product.findOne({ where: { id: itemId, storeId } });
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    product.discount = discount;
    await product.save();

    // Create a new discount record
    const newDiscount = await Discount.create({
      storeId,
      productId: itemId,
      discountPercentage: discount,
      active: true,
      startDate: new Date(),
    });

    // Notify all users about the new discount
    const users = await User.findAll(); // Fetch all users, or modify this query to target specific users

    const notifications = users.map((user) => ({
      userId: user.id,
      storeId: storeId,
      discountId: newDiscount.id,
      message: `New discount on product ${product.name}: ${discount}% off!`,
    }));

    await Notification.bulkCreate(notifications);

    res.status(200).json({
      message: "Discount updated and notifications sent successfully!",
      discount: newDiscount,
    });
  } catch (error) {
    console.error("Error updating discount:", error);
    res.status(500).json({ message: "Error updating discount." });
  }
});

module.exports = router;
