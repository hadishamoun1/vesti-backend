// __tests__/userRoutes.test.js
const request = require("supertest");
const express = require("express");
const bcrypt = require("bcrypt");
const { User } = require("../models/index"); // Mocked version of Sequelize User model
const userRoutes = require("./userRoutes"); // Path to your routes file

// Mock the User model
jest.mock("../models/index", () => ({
  User: {
    create: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use("/api/users", userRoutes); // Add your routes to the Express app

describe("User Routes", () => {
  describe("POST /api/users", () => {
    it("should create a new user", async () => {
      // Mock bcrypt and User model behavior
      const hashedPassword = await bcrypt.hash("password123", 10);
      User.create.mockResolvedValue({
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password: hashedPassword,
        phoneNumber: "1234567890",
      });

      const res = await request(app)
        .post("/api/users")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
          phoneNumber: "1234567890",
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("email", "john@example.com");
      expect(User.create).toHaveBeenCalledTimes(1);
    });

    it("should return 400 if email or password is missing", async () => {
      const res = await request(app).post("/api/users").send({ name: "John" });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("message", "Email and password are required");
    });
  });

  describe("GET /api/users/:id", () => {
    it("should return a user if the user exists", async () => {
      // Mock findByPk
      User.findByPk.mockResolvedValue({
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        phoneNumber: "1234567890",
      });

      const res = await request(app).get("/api/users/1");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("id", 1);
      expect(res.body).toHaveProperty("email", "john@example.com");
      expect(User.findByPk).toHaveBeenCalledTimes(1);
    });

    it("should return 404 if user is not found", async () => {
      // Mock no result from findByPk
      User.findByPk.mockResolvedValue(null);

      const res = await request(app).get("/api/users/999");
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("error", "User not found");
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should update a user if the user exists", async () => {
      const mockUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        phoneNumber: "1234567890",
        update: jest.fn().mockResolvedValue(this),
      };

      // Mock findByPk and update
      User.findByPk.mockResolvedValue(mockUser);

      const res = await request(app).put("/api/users/1").send({
        name: "John Updated",
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("name", "John Updated");
      expect(mockUser.update).toHaveBeenCalledTimes(1);
    });

    it("should return 404 if user is not found", async () => {
      User.findByPk.mockResolvedValue(null);

      const res = await request(app).put("/api/users/999").send({
        name: "John Updated",
      });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("error", "User not found");
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should delete a user if the user exists", async () => {
      const mockUser = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(),
      };

      User.findByPk.mockResolvedValue(mockUser);

      const res = await request(app).delete("/api/users/1");

      expect(res.statusCode).toEqual(204);
      expect(mockUser.destroy).toHaveBeenCalledTimes(1);
    });

    it("should return 404 if user is not found", async () => {
      User.findByPk.mockResolvedValue(null);

      const res = await request(app).delete("/api/users/999");

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("error", "User not found");
    });
  });
});
