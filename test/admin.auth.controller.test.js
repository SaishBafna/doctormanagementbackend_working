import { registerAdmin, loginAdmin } from "../controllers/admin/admin.auth.controller.js";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";

jest.mock("../models/Admin.js");
jest.mock("jsonwebtoken");

describe("Admin Auth Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    process.env.JWT_SECRET = "testsecret";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerAdmin", () => {
    it("should register a new admin successfully", async () => {
      req.body = { name: "Admin", email: "admin@test.com", password: "123456" };

      Admin.findOne.mockResolvedValue(null);
      Admin.create.mockResolvedValue({
        _id: "admin123",
        name: "Admin",
        email: "admin@test.com"
      });

      jwt.sign.mockReturnValue("jwt_token");

      await registerAdmin(req, res);

      expect(Admin.findOne).toHaveBeenCalledWith({ email: "admin@test.com" });
      expect(Admin.create).toHaveBeenCalledWith(req.body);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: "admin123", role: "admin" },
        "testsecret",
        { expiresIn: "30d" }
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        _id: "admin123",
        name: "Admin",
        email: "admin@test.com",
        token: "jwt_token"
      });
    });

    it("should block duplicate admin registration", async () => {
      req.body = { name: "Admin", email: "admin@test.com", password: "123" };

      Admin.findOne.mockResolvedValue({ email: "admin@test.com" });

      await registerAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Admin already exists"
      });
    });

    it("should return 500 if DB fails", async () => {
      Admin.findOne.mockRejectedValue(new Error("DB down"));

      await registerAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: "DB down"
      });
    });
  });

  describe("loginAdmin", () => {
    it("should login admin successfully", async () => {
      req.body = { email: "admin@test.com", password: "123456" };

      const mockAdmin = {
        _id: "admin123",
        name: "Admin",
        email: "admin@test.com",
        matchPassword: jest.fn().mockResolvedValue(true)
      };

      Admin.findOne.mockResolvedValue(mockAdmin);
      jwt.sign.mockReturnValue("jwt_token");

      await loginAdmin(req, res);

      expect(mockAdmin.matchPassword).toHaveBeenCalledWith("123456");
      expect(res.json).toHaveBeenCalledWith({
        _id: "admin123",
        name: "Admin",
        email: "admin@test.com",
        token: "jwt_token"
      });
    });

    it("should reject wrong password", async () => {
      req.body = { email: "admin@test.com", password: "wrong" };

      const mockAdmin = {
        matchPassword: jest.fn().mockResolvedValue(false)
      };

      Admin.findOne.mockResolvedValue(mockAdmin);

      await loginAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid email or password"
      });
    });

    it("should reject when admin not found", async () => {
      Admin.findOne.mockResolvedValue(null);

      await loginAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid email or password"
      });
    });

    it("should return 500 if login throws error", async () => {
      Admin.findOne.mockRejectedValue(new Error("Mongo error"));

      await loginAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: "Mongo error"
      });
    });
  });
});
