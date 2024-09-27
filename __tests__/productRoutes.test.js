const request = require("supertest");
const express = require("express");
const { Product, Store } = require("../models/index");
const productRoutes = require("../routes/productRoutes");

const app = express();
app.use(express.json());
app.use("/api/products", productRoutes);

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
      id: "1", 
      name: "Test Store",
      ownerId: 1,
    };

    mockProduct = {
      id: "1", 
      storeId: "1", 
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
      const response = await request(app).post("/api/products/create").send({}); 

      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({ message: "All fields are required." });
    });
  });

  describe("GET /api/products/:id", () => {
    it("should return a product if the product exists", async () => {
      Product.findByPk.mockResolvedValue(mockProduct);

      const response = await request(app).get("/api/products/1");

      expect(Product.findByPk).toHaveBeenCalledWith("1"); 
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockProduct);
    });

    it("should return 404 if product is not found", async () => {
      Product.findByPk.mockResolvedValue(null);

      const response = await request(app).get("/api/products/999");

      expect(Product.findByPk).toHaveBeenCalledWith("999");
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: "Product not found" }); 
    });
  });

  describe("PUT /api/products/:id", () => {
    it("should return 404 if product is not found", async () => {
      Product.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/products/999")
        .send({ name: "Updated Product" });

      expect(Product.findByPk).toHaveBeenCalledWith("999");
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: "Product not found" }); 
    });
  });

  describe("DELETE /api/products/:id", () => {
    

    it("should return 404 if product is not found", async () => {
      Product.findByPk.mockResolvedValue(null);

      const response = await request(app).delete("/api/products/999");

      expect(Product.findByPk).toHaveBeenCalledWith("999"); 
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: "Product not found" }); 
    });
  });
});
