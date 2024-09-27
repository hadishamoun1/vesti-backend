const request = require("supertest");
const express = require("express");
const discountRouter = require("../routes/discountRoutes"); // Adjust this path to where your discount route is
const { Discount, Notification } = require("../models/index"); // Mock your models

jest.mock("../models"); // Mock all models

const app = express();
app.use(express.json());
app.use("/discounts", discountRouter); // Route prefix

describe("Discount Routes", () => {
  let mockDiscount;
  let mockNotification;

  beforeEach(() => {
    mockDiscount = {
      id: 1,
      storeId: 123,
      active: true,
      update: jest.fn(),
      destroy: jest.fn(),
    };

    mockNotification = {
      destroy: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mock calls after each test
  });

  // POST /discounts/
  it("should create a new discount", async () => {
    Discount.create.mockResolvedValue(mockDiscount);

    const response = await request(app)
      .post("/discounts")
      .send({ storeId: 123, active: true });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("id", 1);
  });

  // GET /discounts/
  it("should return all discounts", async () => {
    Discount.findAll.mockResolvedValue([mockDiscount]);

    const response = await request(app).get("/discounts");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty("id", 1);
  });

  // PUT /discounts/:id
  it("should update a discount by ID", async () => {
    Discount.findByPk.mockResolvedValue(mockDiscount);

    const response = await request(app)
      .put("/discounts/1")
      .send({ active: false });

    expect(response.statusCode).toBe(200);
    expect(mockDiscount.update).toHaveBeenCalledWith({ active: false });
  });

  // DELETE /discounts/:id
  it("should delete a discount by ID", async () => {
    Discount.findByPk.mockResolvedValue(mockDiscount);

    const response = await request(app).delete("/discounts/1");

    expect(response.statusCode).toBe(204);
    expect(mockDiscount.destroy).toHaveBeenCalled();
  });

  // GET /discounts/active?storeId=123
  it("should return active discounts by storeId", async () => {
    Discount.findAll.mockResolvedValue([mockDiscount]);

    const response = await request(app).get("/discounts/active?storeId=123");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty("storeId", 123);
  });

  // POST /discounts/disable
  it("should disable a discount and remove notifications", async () => {
    Discount.findByPk.mockResolvedValue(mockDiscount);
    Notification.destroy.mockResolvedValue(1);

    const response = await request(app)
      .post("/discounts/disable")
      .send({ discountId: 1 });

    expect(response.statusCode).toBe(200);
    expect(mockDiscount.update).toHaveBeenCalledWith({ active: false });
    expect(Notification.destroy).toHaveBeenCalledWith({
      where: { discountId: 1 },
    });
  });

  // GET /discounts/history?storeId=123
  it("should return inactive discounts by storeId", async () => {
    mockDiscount.active = false;
    Discount.findAll.mockResolvedValue([mockDiscount]);

    const response = await request(app).get("/discounts/history?storeId=123");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty("active", false);
  });
});
