const express = require("express");
const router = express.Router();
const path = require("path");
const { Product } = require("../models/index");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "productImages/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/create", upload.single("picture"), async (req, res) => {
  try {
    const {
      storeId,
      name,
      description,
      price,
      category,
      availableColors,
      availableSizes,
    } = req.body;

    // Ensure that all required fields are present
    if (!name || !description || !price || !category || !storeId) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Ensure that availableColors and availableSizes are in the correct format
    const colors = availableColors ? availableColors.split(",") : [];
    const sizes = availableSizes ? availableSizes.split(",") : [];

    const imageUrl = req.file ? req.file.path : null;

    // Convert storeId to integer
    const storeIdInt = parseInt(storeId, 10);

    // Ensure storeId is a valid number
    if (isNaN(storeIdInt)) {
      return res.status(400).json({ message: "Invalid storeId." });
    }

    // Create the product
    const product = await Product.create({
      storeId: storeIdInt,
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

// Function to update discount in the database
const updateDiscountInDatabase = async (storeId, itemId, discount) => {
  try {
    // Find the product
    const product = await Product.findOne({
      where: { id: itemId, storeId: storeId },
    });

    if (!product) {
      return { success: false, message: "Product not found" };
    }

    // Update the discount field (assuming you have a discount field in your Product model)
    product.discount = discount;

    // Save the updated product
    await product.save();

    return { success: true };
  } catch (error) {
    console.error("Error updating discount in database:", error);
    return { success: false, message: "Database update error" };
  }
};

router.post("/discounts/update", async (req, res) => {
  const { storeId, itemId, discount } = req.body;

  if (!storeId || !itemId || !discount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const result = await updateDiscountInDatabase(storeId, itemId, discount);

    if (result.success) {
      return res
        .status(200)
        .json({ message: "Discount updated successfully!" });
    } else {
      return res
        .status(500)
        .json({ message: result.message || "Failed to update discount" });
    }
  } catch (error) {
    console.error("Error updating discount:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while updating the discount." });
  }
});

module.exports = router;
