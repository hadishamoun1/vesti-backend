const request = require("supertest");
const express = require("express");
const { Product, Store } = require("../models/index");
const productRoutes = require("../routes/productRoutes");

const app = express();
app.use(express.json());
app.use("/api/products", productRoutes);

// Mock the Product and Store models
jest.mock("../models", () => ({
  Product: {
    create: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findOne: jest.fn(),
  },
  Store: {
    findByPk: jest.fn(),
  },
}));

describe("Product Routes", () => {
  let mockProduct;
  let mockStore;

  beforeEach(() => {
    mockStore = {
      id: "1", // Ensure this is a string
      name: "Test Store",
      ownerId: 1,
    };

    mockProduct = {
      id: "1", // Ensure this is a string
      storeId: "1", // Ensure this is a string
      name: "Test Product",
      description: "This is a test product.",
      price: 29.99,
      category: "shoes",
      availableColors: ["red", "blue"],
      availableSizes: ["M", "L"],
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/products/create", () => {
    it("should return 400 if required fields are missing", async () => {
      const response = await request(app).post("/api/products/create").send({}); // Send empty body

      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({ message: "All fields are required." });
    });
  });

  describe("GET /api/products/:id", () => {
    it("should return a product if the product exists", async () => {
      Product.findByPk.mockResolvedValue(mockProduct);

      const response = await request(app).get("/api/products/1");

      expect(Product.findByPk).toHaveBeenCalledWith("1"); // Ensure this is a string
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockProduct);
    });

    it("should return 404 if product is not found", async () => {
      Product.findByPk.mockResolvedValue(null);

      const response = await request(app).get("/api/products/999");

      expect(Product.findByPk).toHaveBeenCalledWith("999"); // Ensure this is a string
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: "Product not found" }); // Changed from message to error
    });
  });

  describe("PUT /api/products/:id", () => {
    it("should return 404 if product is not found", async () => {
      Product.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/products/999")
        .send({ name: "Updated Product" });

      expect(Product.findByPk).toHaveBeenCalledWith("999"); // Ensure this is a string
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: "Product not found" }); // Changed from message to error
    });
  });

  describe("DELETE /api/products/:id", () => {
    

    it("should return 404 if product is not found", async () => {
      Product.findByPk.mockResolvedValue(null);

      const response = await request(app).delete("/api/products/999");

      expect(Product.findByPk).toHaveBeenCalledWith("999"); // Ensure this is a string
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: "Product not found" }); // Changed from message to error
    });
  });
});
