import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from "../controllers/admin/admin.user.controller.js";

import User from "../models/User.js";

jest.mock("../models/User.js");

describe("Admin User Controller", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => jest.clearAllMocks());

  // ---------------- CREATE ----------------
  describe("createUser", () => {
    it("should create user successfully", async () => {
      const saveMock = jest.fn();

      User.mockImplementation(() => ({
        email: "test@test.com",
        save: saveMock
      }));

      User.findOne.mockResolvedValue(null);

      await createUser(req, res);

      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should block duplicate email", async () => {
      User.findOne.mockResolvedValue({ email: "test@test.com" });

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- GET ALL ----------------
  describe("getAllUsers", () => {
    it("should return paginated users with stats", async () => {
      req.query = { page: "1", limit: "10", search: "john" };

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ name: "John" }])
      });

      User.countDocuments
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1) // verified
        .mockResolvedValueOnce(0) // unverified
        .mockResolvedValueOnce(1); // new signups

      await getAllUsers(req, res);

      expect(res.json).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
        items: [{ name: "John" }],
        stats: {
          totalUsers: 1,
          activeUsers: 1,
          inactiveUsers: 0,
          newSignupsLast30Days: 1
        }
      });
    });
  });

  // ---------------- GET BY ID ----------------
  describe("getUserById", () => {
    it("should return user", async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ name: "User A" })
      });

      await getUserById({ params: { id: "1" } }, res);

      expect(res.json).toHaveBeenCalledWith({ name: "User A" });
    });

    it("should return 404 if not found", async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await getUserById({ params: { id: "1" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- UPDATE ----------------
  describe("updateUser", () => {
    it("should update user fields", async () => {
      const mockUser = {
        name: "Old",
        save: jest.fn()
      };

      User.findById.mockResolvedValue(mockUser);

      req.params.id = "1";
      req.body = { name: "New" };

      await updateUser(req, res);

      expect(mockUser.name).toBe("New");
      expect(res.json).toHaveBeenCalledWith({
        message: "User updated",
        user: mockUser
      });
    });

    it("should return 404 if missing", async () => {
      User.findById.mockResolvedValue(null);

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- DELETE ----------------
  describe("deleteUser", () => {
    it("should delete user", async () => {
      User.findByIdAndDelete.mockResolvedValue({});

      await deleteUser({ params: { id: "1" } }, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "User deleted successfully"
      });
    });

    it("should return 404 if not found", async () => {
      User.findByIdAndDelete.mockResolvedValue(null);

      await deleteUser({ params: { id: "1" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
