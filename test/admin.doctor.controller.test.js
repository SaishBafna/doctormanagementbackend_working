import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
} from "../controllers/admin/admin.doctor.controller.js";

import Doctor from "../models/Doctor.js";

jest.mock("../models/Doctor.js");

describe("Admin Doctor Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- CREATE ----------------
  describe("createDoctor", () => {
    it("should create a doctor successfully", async () => {
      const saveMock = jest.fn().mockResolvedValue();

      Doctor.mockImplementation(() => ({
        save: saveMock,
        name: "Dr Test"
      }));

      await createDoctor(req, res);

      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Doctor created successfully",
        doctor: expect.any(Object)
      });
    });

    it("should return 400 if save fails", async () => {
      Doctor.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error("Invalid"))
      }));

      await createDoctor(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid data",
        error: "Invalid"
      });
    });
  });

  // ---------------- GET DOCTORS ----------------
  describe("getDoctors", () => {
    it("should return paginated doctors with summary", async () => {
      req.query = { search: "cardio", page: "1", limit: "5" };

      Doctor.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ name: "Dr A" }])
      });

      Doctor.countDocuments
        .mockResolvedValueOnce(1) // filtered
        .mockResolvedValueOnce(10) // totalDoctors
        .mockResolvedValueOnce(6); // activeDoctors

      Doctor.distinct.mockResolvedValue(["Cardiology", "Neuro"]);

      Doctor.aggregate.mockResolvedValue([{ avgRating: 4.678 }]);

      await getDoctors(req, res);

      expect(res.json).toHaveBeenCalledWith({
        summary: {
          totalDoctors: 10,
          activeDoctors: 6,
          specialities: 2,
          avgRating: 4.68
        },
        filteredCount: 1,
        page: 1,
        limit: 5,
        totalPages: 1,
        items: [{ name: "Dr A" }]
      });
    });

    it("should handle empty avg rating", async () => {
      Doctor.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      Doctor.countDocuments
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      Doctor.distinct.mockResolvedValue([]);
      Doctor.aggregate.mockResolvedValue([]);

      await getDoctors(req, res);

      expect(res.json.mock.calls[0][0].summary.avgRating).toBe(0);
    });

    it("should return 500 on failure", async () => {
      Doctor.find.mockImplementation(() => {
        throw new Error("Mongo crash");
      });

      await getDoctors(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: "Mongo crash"
      });
    });
  });

  // ---------------- GET BY ID ----------------
  describe("getDoctorById", () => {
    it("should return a doctor", async () => {
      Doctor.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ name: "Dr Test" })
      });

      req.params.id = "123";

      await getDoctorById(req, res);

      expect(res.json).toHaveBeenCalledWith({ name: "Dr Test" });
    });

    it("should return 404 if not found", async () => {
      Doctor.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getDoctorById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- UPDATE ----------------
  describe("updateDoctor", () => {
    it("should update doctor", async () => {
      Doctor.findByIdAndUpdate.mockResolvedValue({ name: "Updated" });

      await updateDoctor(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Doctor updated successfully",
        doctor: { name: "Updated" }
      });
    });

    it("should return 404 if not found", async () => {
      Doctor.findByIdAndUpdate.mockResolvedValue(null);

      await updateDoctor(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- DELETE ----------------
  describe("deleteDoctor", () => {
    it("should delete doctor", async () => {
      Doctor.findByIdAndDelete.mockResolvedValue({});

      await deleteDoctor(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Doctor deleted successfully"
      });
    });

    it("should return 404 if not found", async () => {
      Doctor.findByIdAndDelete.mockResolvedValue(null);

      await deleteDoctor(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
