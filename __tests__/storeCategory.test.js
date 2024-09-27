const request = require("supertest");
const express = require("express");
const storeCategoryRouter = require("../routes/storeCategoryRoutes"); 
const { StoreCategory } = require("../models/index"); 

jest.mock("../models"); 

const app = express();
app.use(express.json());
app.use("/store-categories", storeCategoryRouter); 

describe("StoreCategory Routes", () => {
  let mockStoreCategory;

  beforeEach(() => {
    mockStoreCategory = {
      id: 1,
      name: "Electronics",
      update: jest.fn(),
      destroy: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks(); 
  });

  // POST /store-categories/
  it("should create a new store category", async () => {
    StoreCategory.create.mockResolvedValue(mockStoreCategory);

    const response = await request(app)
      .post("/store-categories")
      .send({ name: "Electronics" });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("id", 1);
    expect(response.body).toHaveProperty("name", "Electronics");
  });

  it("should return all store categories", async () => {
    StoreCategory.findAll.mockResolvedValue([mockStoreCategory]);

    const response = await request(app).get("/store-categories");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty("id", 1);
    expect(response.body[0]).toHaveProperty("name", "Electronics");
  });

 
  it("should return a store category by ID", async () => {
    StoreCategory.findByPk.mockResolvedValue(mockStoreCategory);

    const response = await request(app).get("/store-categories/1");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id", 1);
    expect(response.body).toHaveProperty("name", "Electronics");
  });

  it("should return 404 if store category is not found", async () => {
    StoreCategory.findByPk.mockResolvedValue(null);

    const response = await request(app).get("/store-categories/1");

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error", "Store category not found");
  });

  it("should update a store category by ID", async () => {
    StoreCategory.findByPk.mockResolvedValue(mockStoreCategory);

    const response = await request(app)
      .put("/store-categories/1")
      .send({ name: "New Name" });

    expect(response.statusCode).toBe(200);
    expect(mockStoreCategory.update).toHaveBeenCalledWith({ name: "New Name" });
  });

  it("should return 404 if store category to update is not found", async () => {
    StoreCategory.findByPk.mockResolvedValue(null);

    const response = await request(app)
      .put("/store-categories/1")
      .send({ name: "New Name" });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error", "Store category not found");
  });

  it("should delete a store category by ID", async () => {
    StoreCategory.findByPk.mockResolvedValue(mockStoreCategory);

    const response = await request(app).delete("/store-categories/1");

    expect(response.statusCode).toBe(204);
    expect(mockStoreCategory.destroy).toHaveBeenCalled();
  });

  it("should return 404 if store category to delete is not found", async () => {
    StoreCategory.findByPk.mockResolvedValue(null);

    const response = await request(app).delete("/store-categories/1");

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error", "Store category not found");
  });
});
