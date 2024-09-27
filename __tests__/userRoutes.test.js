
const request = require("supertest");
const express = require("express");
const { User } = require("../models/index");
const userRoutes = require("../routes/userRoutes");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);

jest.mock("../models", () => ({
  User: {
    create: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(() => Promise.resolve("hashedpassword")),
}));

describe("User Routes", () => {
  let mockUser;

  beforeEach(() => {
    mockUser = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      password: "hashedpassword", 
      phoneNumber: "1234567890",
      update: jest.fn(),
      destroy: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/users", () => {
    it("should create a new user", async () => {
      User.create.mockResolvedValue(mockUser);

      const response = await request(app).post("/api/users").send({
        name: "John Doe",
        email: "john@example.com",
        password: "password",
        phoneNumber: "1234567890",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("password", 10);
      expect(User.create).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        password: "hashedpassword",
        phoneNumber: "1234567890",
      });
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        phoneNumber: "1234567890",
        password: expect.any(String), 
      });
    });

    it("should return 400 if email or password is missing", async () => {
      const response = await request(app)
        .post("/api/users")
        .send({ name: "John Doe" });

      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        message: "Email and password are required",
      });
    });
  });

  describe("GET /api/users/:id", () => {
    it("should return a user if the user exists", async () => {
      User.findByPk.mockResolvedValue(mockUser);

      const response = await request(app).get("/api/users/1");

      expect(User.findByPk).toHaveBeenCalledWith("1");
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        phoneNumber: "1234567890",
        password: expect.any(String), 
      });
    });

    it("should return 404 if user is not found", async () => {
      User.findByPk.mockResolvedValue(null);

      const response = await request(app).get("/api/users/1");

      expect(User.findByPk).toHaveBeenCalledWith("1");
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: "User not found" });
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should update a user if the user exists", async () => {
      User.findByPk.mockResolvedValue(mockUser);

      const response = await request(app)
        .put("/api/users/1")
        .send({ name: "John Updated", email: "johnupdated@example.com" });

      expect(User.findByPk).toHaveBeenCalledWith("1");
      expect(mockUser.update).toHaveBeenCalledWith({
        name: "John Updated",
        email: "johnupdated@example.com",
        phoneNumber: "1234567890",
      });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        phoneNumber: "1234567890",
        password: expect.any(String), 
      });
    });

    it("should return 404 if user is not found", async () => {
      User.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/users/1")
        .send({ name: "John Updated", email: "johnupdated@example.com" });

      expect(User.findByPk).toHaveBeenCalledWith("1");
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: "User not found" });
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should delete a user if the user exists", async () => {
      User.findByPk.mockResolvedValue(mockUser);

      const response = await request(app).delete("/api/users/1");

      expect(User.findByPk).toHaveBeenCalledWith("1");
      expect(mockUser.destroy).toHaveBeenCalled();
      expect(response.statusCode).toBe(204);
    });

    it("should return 404 if user is not found", async () => {
      User.findByPk.mockResolvedValue(null);

      const response = await request(app).delete("/api/users/1");

      expect(User.findByPk).toHaveBeenCalledWith("1");
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: "User not found" });
    });
  });
});
