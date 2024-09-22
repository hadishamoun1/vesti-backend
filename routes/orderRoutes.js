const express = require("express");
const router = express.Router();
const { Order, Product, OrderItem } = require("../models/index");

// Create a new order
router.post("/", async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get an order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /orders/update/:orderId
router.put('/update/:orderId', async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const [affectedRows] = await Order.update(
      { status: 'paid' },
      {
        where: { id: orderId } // Assuming `id` is the primary key field
      }
    );

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Order updated to paid' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating order', error });
  }
});

// Delete an order by ID
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (order) {
      await order.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/history/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const orders = await Order.findAll({
      where: {
        userId: userId,
        status: "paid",
      },
    });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});
router.post("/add-to-cart", async (req, res) => {
  const { userId, storeId, productId, quantity, sizes, colors } = req.body;
  // Validate sizes and colors
  if (!Array.isArray(sizes) || !Array.isArray(colors)) {
    return res
      .status(400)
      .json({ message: "Sizes and colors must be arrays." });
  }

  try {
    let order = await Order.findOne({
      where: {
        userId,
        storeId,
        status: "Pending",
      },
    });

    if (!order) {
      order = await Order.create({
        userId,
        storeId,
        totalAmount: 0,
        status: "Pending",
      });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const orderItem = await OrderItem.create({
      orderId: order.id,
      productId,
      quantity,
      Sizes: sizes,
      Colors: colors,
      priceAtPurchase: product.price,
    });

    const totalAmount = await OrderItem.sum("priceAtPurchase", {
      where: { orderId: order.id },
    });
    await order.update({ totalAmount });

    res.status(201).json(orderItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});
router.post("/update-cart", async (req, res) => {
  const { userId, storeId, items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ message: "Items must be an array." });
  }

  try {
    let order = await Order.findOne({
      where: { userId, storeId, status: "Pending" },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Remove existing items
    await OrderItem.destroy({ where: { orderId: order.id } });

    let totalAmount = 0;

    for (const item of items) {
      try {
        const product = await Product.findByPk(item.productId);
        if (!product) {
          console.warn(`Product with ID ${item.productId} not found.`);
          continue;
        }

        const sizes = Array.isArray(item.Sizes) ? item.Sizes : [];
        const colors = Array.isArray(item.Colors) ? item.Colors : [];

        console.log("Saving item with sizes:", sizes);
        console.log("Saving item with colors:", colors);

        const orderItem = await OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: product.price,
          Sizes: sizes,
          Colors: colors,
        });

        totalAmount += orderItem.priceAtPurchase * orderItem.quantity;
      } catch (innerError) {
        console.error(`Error processing item ${item.productId}:`, innerError);
      }
    }

    await order.update({ totalAmount });

    res.status(200).json({ message: "Cart updated successfully", totalAmount });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

module.exports = router;
