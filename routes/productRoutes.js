const express = require("express");
const router = express.Router();
const { Product } = require("../models/index");

router.post("/", async (req, res) => {
  console.log("Request body:", req.body); // Log the request body
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error); // Log the error
    res.status(400).json({ error: error.message });
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
router.get('/products/:storeId', async (req, res) => {
  const { storeId } = req.params;

  try {
    const products = await Product.findAll({ where: { storeId } });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching products.' });
  }
});


module.exports = router;
