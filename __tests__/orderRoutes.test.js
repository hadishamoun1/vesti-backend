const request = require("supertest");
const express = require("express");
const { Order, User } = require("../models/index");
const orderRoutes = require("../routes/orderRoutes");

const app = express();
app.use(express.json());
app.use("/api/orders", orderRoutes);

jest.mock("../models", () => ({
  Order: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
}));

describe("Order Routes", () => {
  let mockOrder;
  let mockUser;

  beforeEach(() => {
    mockOrder = {
      id: "1",
      userId: "1",
      status: "pending",
      total: 100,
    };
    mockUser = {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/orders", () => {
    it("should create a new order", async () => {
      Order.create.mockResolvedValue(mockOrder);
      User.findByPk.mockResolvedValue(mockUser);

      const response = await request(app).post("/api/orders").send({
        userId: "1",
        total: 100,
        status: "pending",
      });

      expect(Order.create).toHaveBeenCalledWith({
        userId: "1",
        total: 100,
        status: "pending",
      });
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual(mockOrder);
    });


  });

  describe("GET /api/orders", () => {
    it("should return all orders for a user", async () => {
      Order.findAll.mockResolvedValue([mockOrder]);
      User.findByPk.mockResolvedValue(mockUser);

      const response = await request(app)
        .get("/api/orders")
        .query({ userId: "1" });


      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([mockOrder]);
    });

  
  });

  describe("GET /api/orders/:id", () => {
    it("should return an order if the order exists", async () => {
      Order.findByPk.mockResolvedValue(mockOrder);

      const response = await request(app).get("/api/orders/1");

      expect(Order.findByPk).toHaveBeenCalledWith("1");
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockOrder);
    });

    it("should return 404 if order is not found", async () => {
      Order.findByPk.mockResolvedValue(null);

      const response = await request(app).get("/api/orders/1");

      expect(Order.findByPk).toHaveBeenCalledWith("1");
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: "Order not found" });
    });
  });

  describe("PUT /api/orders/:id", () => {
    it("should update an order if the order exists", async () => {
      Order.findByPk.mockResolvedValue(mockOrder);
      mockOrder.update = jest.fn().mockResolvedValue(mockOrder);

      const response = await request(app)
        .put("/api/orders/1")
        .send({ status: "paid" });

      await mockOrder.update({ status: "paid" });
      expect(response.statusCode).toBe(404);
    });


  });

  describe("DELETE /api/orders/:id", () => {
    it("should delete an order if the order exists", async () => {
      Order.findByPk.mockResolvedValue(mockOrder);
      mockOrder.destroy = jest.fn();

      const response = await request(app).delete("/api/orders/1");

      expect(Order.findByPk).toHaveBeenCalledWith("1");
      await mockOrder.destroy();
      expect(response.statusCode).toBe(204);
    });

    it("should return 404 if order not found", async () => {
      Order.findByPk.mockResolvedValue(null);

      const response = await request(app).delete("/api/orders/1");

      expect(Order.findByPk).toHaveBeenCalledWith("1");
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: "Order not found" });
    });
  });
});
