import {
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
  getAllServices,
  getServiceById
} from "../controllers/admin/admin.service.controller.js";

import Service from "../models/Service.js";
import slugify from "slugify";

jest.mock("../models/Service.js");
jest.mock("slugify");

describe("Admin Service Controller", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    slugify.mockReturnValue("test-service");
  });

  afterEach(() => jest.clearAllMocks());

  // ---------------- CREATE ----------------
  describe("createService", () => {
    it("should create service with slug", async () => {
      req.body = { name: "Hair Care" };

      Service.create.mockResolvedValue({ name: "Hair Care" });

      await createService(req, res);

      expect(slugify).toHaveBeenCalledWith("Hair Care", { lower: true });
      expect(Service.create).toHaveBeenCalledWith({
        name: "Hair Care",
        slug: "test-service"
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should return 400 on failure", async () => {
      Service.create.mockRejectedValue(new Error("Invalid"));

      await createService(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ---------------- UPDATE ----------------
  describe("updateService", () => {
    it("should update service & slug", async () => {
      req.body = { name: "Skin Care" };
      req.params.id = "1";

      Service.findByIdAndUpdate.mockResolvedValue({ name: "Skin Care" });

      await updateService(req, res);

      expect(slugify).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { name: "Skin Care" }
      });
    });
  });

  // ---------------- DELETE ----------------
  describe("deleteService", () => {
    it("should delete service", async () => {
      Service.findByIdAndDelete.mockResolvedValue({});

      await deleteService({ params: { id: "1" } }, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Service deleted"
      });
    });
  });

  // ---------------- TOGGLE ----------------
  describe("toggleServiceStatus", () => {
    it("should toggle service status", async () => {
      const mockService = { isActive: true, save: jest.fn() };
      Service.findById.mockResolvedValue(mockService);

      await toggleServiceStatus({ params: { id: "1" } }, res);

      expect(mockService.isActive).toBe(false);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockService
      });
    });
  });

  // ---------------- GET ALL ----------------
  describe("getAllServices", () => {
    it("should return paginated services with stats", async () => {
      Service.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ name: "S1" }])
      });

      Service.countDocuments
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(3);

      await getAllServices({ query: { page: "1", limit: "10" } }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ name: "S1" }],
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
  describe("getServiceById", () => {
    it("should return service", async () => {
      Service.findById.mockResolvedValue({ name: "Service A" });

      await getServiceById({ params: { id: "1" } }, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { name: "Service A" }
      });
    });

    it("should return 404 if not found", async () => {
      Service.findById.mockResolvedValue(null);

      await getServiceById({ params: { id: "1" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
