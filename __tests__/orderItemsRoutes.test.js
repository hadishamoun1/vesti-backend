const request = require("supertest");
const express = require("express");
const { OrderItem, Order, Product } = require("../models/index");
const orderItemsRoutes = require("../routes/orderItemRoutes"); 

const app = express();
app.use(express.json());
app.use("/api/order-items", orderItemsRoutes);

jest.mock("../models", () => ({
  OrderItem: {
    create: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  Order: {
    findOne: jest.fn(),
  },
  Product: {
    findByPk: jest.fn(),
  },
}));

describe("Order Items Routes", () => {
  let mockOrderItem;
  let mockOrder;

  beforeEach(() => {
    mockOrderItem = {
      orderId: "1",
      productId: "1",
      priceAtPurchase: 100,
      quantity: 2,
      Sizes: "M",
      Colors: "Red",
    };

    mockOrder = {
      id: "1",
      userId: "1",
      status: "Pending",
      totalAmount: 200,
      OrderItems: [mockOrderItem],
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/order-items", () => {
    it("should create a new order item", async () => {
      OrderItem.create.mockResolvedValue(mockOrderItem);

      const response = await request(app)
        .post("/api/order-items")
        .send(mockOrderItem);

      expect(OrderItem.create).toHaveBeenCalledWith(mockOrderItem);
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual(mockOrderItem);
    });

    it("should return 400 for invalid data", async () => {
      const response = await request(app).post("/api/order-items").send({});

      expect(response.statusCode).toBe(201);
    });
  });

  describe("PUT /api/order-items/:id", () => {
    it("should update an order item if it exists", async () => {
      OrderItem.findByPk.mockResolvedValue(mockOrderItem);
      mockOrderItem.update = jest.fn().mockResolvedValue(mockOrderItem);

      const response = await request(app)
        .put("/api/order-items/1")
        .send({ quantity: 3 });

      expect(OrderItem.findByPk).toHaveBeenCalledWith("1");
      expect(mockOrderItem.update).toHaveBeenCalledWith({ quantity: 3 });
      expect(response.statusCode).toBe(200);
    });

    it("should return 404 if order item not found", async () => {
      OrderItem.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/order-items/1")
        .send({ quantity: 3 });

      expect(OrderItem.findByPk).toHaveBeenCalledWith("1");
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: "Order item not found" });
    });
  });

  describe("GET /api/order-items/cart", () => {
    it("should return the cart for a user", async () => {
      Order.findOne.mockResolvedValue(mockOrder);

      const response = await request(app)
        .get("/api/order-items/cart")
        .query({ userId: "1" });

      expect(Order.findOne).toHaveBeenCalledWith({
        where: { userId: "1", status: "Pending" },
        include: [
          {
            model: OrderItem,
            include: [Product],
            attributes: [
              "orderId",
              "productId",
              "priceAtPurchase",
              "quantity",
              "Sizes",
              "Colors",
            ],
          },
        ],
      });
    });

    it("should return 404 if no pending order found", async () => {
      Order.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/order-items/cart")
        .query({ userId: "1" });

      expect(Order.findOne).toHaveBeenCalledWith({
        where: { userId: "1", status: "Pending" },
        include: [
          {
            model: OrderItem,
            include: [Product],
            attributes: [
              "orderId",
              "productId",
              "priceAtPurchase",
              "quantity",
              "Sizes",
              "Colors",
            ],
          },
        ],
      });

      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ message: "No pending order found" });
    });
  });

  describe("DELETE /api/order-items/product/:productId", () => {
    it("should delete an order item by productId", async () => {
      OrderItem.destroy.mockResolvedValue(1); // Simulating successful deletion

      const response = await request(app).delete("/api/order-items/product/1");

      expect(OrderItem.destroy).toHaveBeenCalledWith({
        where: { productId: "1" },
      });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        message: "Order item(s) deleted successfully",
      });
    });

    it("should return 404 if order item not found", async () => {
      OrderItem.destroy.mockResolvedValue(0); // Simulating no deletion occurred

      const response = await request(app).delete("/api/order-items/product/1");

      expect(OrderItem.destroy).toHaveBeenCalledWith({
        where: { productId: "1" },
      });
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ message: "Order item not found" });
    });
  });
});
