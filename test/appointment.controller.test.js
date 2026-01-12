import {
  bookAppointment,
  getMyAppointments
} from "../controllers/appointment/appointment.controller.js";

import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";

jest.mock("../models/Appointment.js");
jest.mock("../models/Doctor.js");

describe("Appointment Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: { id: "user1" }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => jest.clearAllMocks());

  // ---------------- BOOK ----------------
  describe("bookAppointment", () => {
    it("should book slot successfully", async () => {
      req.body = {
        doctorId: "doc1",
        date: "2026-01-15",
        time: "10:00"
      };

      Appointment.findOne.mockResolvedValue(null);
      Doctor.findOneAndUpdate.mockResolvedValue({ _id: "doc1" });

      const saveMock = jest.fn();
      Appointment.mockImplementation(() => ({
        save: saveMock
      }));

      await bookAppointment(req, res);

      expect(Doctor.findOneAndUpdate).toHaveBeenCalled();
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should block duplicate booking", async () => {
      Appointment.findOne.mockResolvedValue({});

      await bookAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject unavailable slot", async () => {
      Appointment.findOne.mockResolvedValue(null);
      Doctor.findOneAndUpdate.mockResolvedValue(null);

      await bookAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject missing fields", async () => {
      await bookAppointment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ---------------- GET MY APPOINTMENTS ----------------
  describe("getMyAppointments", () => {
    it("should return user appointments sorted", async () => {
      Appointment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ date: "2026-01-15" }])
      });

      await getMyAppointments(req, res);

      expect(res.json).toHaveBeenCalledWith([{ date: "2026-01-15" }]);
    });

    it("should return 500 on error", async () => {
      Appointment.find.mockImplementation(() => {
        throw new Error("Mongo crash");
      });

      await getMyAppointments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
