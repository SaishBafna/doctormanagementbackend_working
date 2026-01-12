import {
  createPackage,
  updatePackage,
  deletePackage,
  togglePackageStatus,
  getAllPackages,
  getPackageById
} from "../controllers/admin/admin.package.controller.js";

import Package from "../models/Package.js";
import Service from "../models/Service.js";
import slugify from "slugify";

jest.mock("../models/Package.js");
jest.mock("../models/Service.js");
jest.mock("slugify");

describe("Admin Package Controller", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    slugify.mockReturnValue("test-package");
  });

  afterEach(() => jest.clearAllMocks());

  // ---------------- CREATE ----------------
  describe("createPackage", () => {
    it("should create package successfully", async () => {
      req.body = {
        name: "Gold Pack",
        services: ["s1", "s2"],
        packagePrice: 1000
      };

      Service.find.mockResolvedValue([
        { durationMinutes: 30, priceTo: 200 },
        { durationMinutes: 60, priceFrom: 300 }
      ]);

      Package.create.mockResolvedValue({ name: "Gold Pack" });

      await createPackage(req, res);

      expect(Package.create).toHaveBeenCalledWith({
        name: "Gold Pack",
        slug: "test-package",
        services: [{ service: "s1" }, { service: "s2" }],
        totalDuration: 90,
        regularPrice: 500,
        packagePrice: 1000,
        description: undefined
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { name: "Gold Pack" }
      });
    });

    it("should reject invalid services", async () => {
      req.body = { name: "Pack", services: ["1", "2"] };
      Service.find.mockResolvedValue([{ _id: "1" }]);

      await createPackage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ---------------- UPDATE ----------------
  describe("updatePackage", () => {
    it("should update package & slug", async () => {
      req.body = { name: "New Name" };
      req.params.id = "1";

      Package.findByIdAndUpdate.mockResolvedValue({ name: "New Name" });

      await updatePackage(req, res);

      expect(slugify).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { name: "New Name" }
      });
    });

    it("should reject invalid services format", async () => {
      req.body = { services: "invalid" };

      await updatePackage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ---------------- DELETE ----------------
  describe("deletePackage", () => {
    it("should delete package", async () => {
      Package.findByIdAndDelete.mockResolvedValue({});

      await deletePackage({ params: { id: "1" } }, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Package deleted"
      });
    });

    it("should return 404 if not found", async () => {
      Package.findByIdAndDelete.mockResolvedValue(null);

      await deletePackage({ params: { id: "1" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- TOGGLE ----------------
  describe("togglePackageStatus", () => {
    it("should toggle isActive", async () => {
      const pack = { isActive: true, save: jest.fn() };
      Package.findById.mockResolvedValue(pack);

      await togglePackageStatus({ params: { id: "1" } }, res);

      expect(pack.isActive).toBe(false);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: pack
      });
    });
  });

  // ---------------- GET ALL ----------------
  describe("getAllPackages", () => {
    it("should return paginated packages with stats", async () => {
      Package.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ name: "P1" }])
      });

      Package.countDocuments
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(3);

      await getAllPackages({ query: { page: "1", limit: "10" } }, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ name: "P1" }],
        pagination: {
          total: 10,
          page: 1,
          limit: 10,
          totalPages: 1,
          totalItems: 1
        },
        stats: {
          total: 10,
          active: 7,
          inactive: 3
        }
      });
    });
  });

  // ---------------- GET BY ID ----------------
  describe("getPackageById", () => {
    it("should return package", async () => {
      Package.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ name: "Gold" })
      });

      await getPackageById({ params: { id: "1" } }, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { name: "Gold" }
      });
    });

    it("should return 404 if missing", async () => {
      Package.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getPackageById({ params: { id: "1" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
