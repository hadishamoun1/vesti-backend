const request = require("supertest");
const express = require("express");
const loginRouter = require("../routes/loginRoute"); // Adjust the path as necessary
const { User, Store } = require("../models/index"); // Mock the User and Store models

jest.mock("../models"); // Mock all models

const app = express();
app.use(express.json());
app.use("/login", loginRouter); // Route prefix

describe("Login Routes", () => {
  let mockUser;
  let mockStore;

  beforeEach(() => {
    mockUser = {
      id: 1,
      email: "test@example.com",
      password: "$2b$10$fakeHashedPassword", // This would be a hashed password
      role: "user",
      update: jest.fn(),
    };

    mockStore = {
      id: 1,
      name: "Test Store",
      ownerId: 1,
    };
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mock calls after each test
  });

  // POST /login/
  it("should return 400 if email or password is missing", async () => {
    const response = await request(app).post("/login").send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Email and password are required");
  });

  it("should return 400 if user is not found", async () => {
    User.findOne.mockResolvedValue(null); // No user found

    const response = await request(app)
      .post("/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("User not found");
  });

  it("should return 400 if password is incorrect", async () => {
    User.findOne.mockResolvedValue(mockUser); // User found
    jest.spyOn(require("bcrypt"), "compare").mockResolvedValue(false); // Password doesn't match

    const response = await request(app)
      .post("/login")
      .send({ email: "test@example.com", password: "wrongpassword" });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Incorrect password");
  });

  it("should return 200 and a token if login is successful", async () => {
    User.findOne.mockResolvedValue(mockUser); // User found
    jest.spyOn(require("bcrypt"), "compare").mockResolvedValue(true); // Password matches
    jest.spyOn(require("jsonwebtoken"), "sign").mockReturnValue("fakeToken"); // Fake token

    const response = await request(app)
      .post("/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.token).toBe("fakeToken");
  });

  // POST /login/store
  it("should return 400 if user is not found when logging in to store", async () => {
    User.findOne.mockResolvedValue(null); // No user found

    const response = await request(app)
      .post("/login/store")
      .send({ email: "test@example.com", password: "password123" });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("User not found");
  });

  it("should return 400 if password is incorrect for store login", async () => {
    User.findOne.mockResolvedValue(mockUser); // User found
    jest.spyOn(require("bcrypt"), "compare").mockResolvedValue(false); // Password doesn't match

    const response = await request(app)
      .post("/login/store")
      .send({ email: "test@example.com", password: "wrongpassword" });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Incorrect password");
  });

  it("should return 400 if the user is not a store owner", async () => {
    User.findOne.mockResolvedValue(mockUser); // User found, but not a store owner
    jest.spyOn(require("bcrypt"), "compare").mockResolvedValue(true); // Password matches
    Store.findOne.mockResolvedValue(null); // No store found for user

    const response = await request(app)
      .post("/login/store")
      .send({ email: "test@example.com", password: "password123" });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("User not found");
  });

  it("should return 200 and a token if store owner login is successful", async () => {
    User.findOne.mockResolvedValue(mockUser); // User found
    jest.spyOn(require("bcrypt"), "compare").mockResolvedValue(true); // Password matches
    Store.findOne.mockResolvedValue(mockStore); // Store found
    jest
      .spyOn(require("jsonwebtoken"), "sign")
      .mockReturnValue("fakeStoreToken"); // Fake token

    const response = await request(app)
      .post("/login/store")
      .send({ email: "test@example.com", password: "password123" });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.token).toBe("fakeStoreToken");
    expect(response.body.store).toEqual({
      id: 1,
      name: "Test Store",
    });
  });
});
