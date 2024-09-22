const express = require("express");
const router = express.Router();
const { OrderItem, Order, Product } = require("../models/index");

// Create a new order item
router.post("/", async (req, res) => {
  try {
    const orderItem = await OrderItem.create(req.body);
    res.status(201).json(orderItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Update an order item by ID
router.put("/:id", async (req, res) => {
  try {
    const orderItem = await OrderItem.findByPk(req.params.id);
    if (orderItem) {
      await orderItem.update(req.body);
      res.json(orderItem);
    } else {
      res.status(404).json({ error: "Order item not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.get("/cart", async (req, res) => {
  const { userId } = req.query;

  try {
    const order = await Order.findOne({
      where: {
        userId,
        status: "Pending",
      },
      include: [
        {
          model: OrderItem,
          include: [Product],
          attributes: [
            'orderId',
            'productId',
            'priceAtPurchase',
            'quantity',
            'Sizes',  // Ensure these names match your model
            'Colors',
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "No pending order found" });
    }

    const cartItems = order.OrderItems.map((item) => ({
      orderId: item.orderId,
      productId: item.productId,
      name: item.Product.name,
      price: item.priceAtPurchase,
      quantity: item.quantity,
      Sizes: item.Sizes,  
      Colors: item.Colors,
      storeId: order.storeId,
    }));

    res.status(200).json({
      cartItems,
      totalAmount: order.totalAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Delete order item by productId
router.delete("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    // Delete the items with the provided productId
    const result = await OrderItem.destroy({
      where: {
        productId: productId,
      },
    });

    if (result === 0) {
      return res.status(404).json({ message: "Order item not found" });
    }

    res.status(200).json({ message: "Order item(s) deleted successfully" });
  } catch (error) {
    console.error("Error deleting order item:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
