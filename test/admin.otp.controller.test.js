import {
  sendOtp,
  verifyOtpAndResetPassword,
  resendOtp
} from "../controllers/admin/admin.otp.controller.js";

import Admin from "../models/Admin.js";
import sendEmail from "../utils/sendEmail.js";

jest.mock("../models/Admin.js");
jest.mock("../utils/sendEmail.js");

describe("Admin OTP Controller", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- SEND OTP ----------------
  describe("sendOtp", () => {
    it("should generate OTP and send email", async () => {
      const mockAdmin = {
        email: "admin@test.com",
        save: jest.fn()
      };

      Admin.findOne.mockResolvedValue(mockAdmin);
      sendEmail.mockResolvedValue();

      req.body.email = "admin@test.com";

      await sendOtp(req, res);

      expect(mockAdmin.otp).toHaveLength(6);
      expect(mockAdmin.otpExpiry).toBeGreaterThan(Date.now());
      expect(sendEmail).toHaveBeenCalledWith(
        "admin@test.com",
        "Admin Password Reset OTP",
        expect.stringContaining(mockAdmin.otp)
      );
      expect(res.json).toHaveBeenCalledWith({ message: "OTP sent to email" });
    });

    it("should return 404 if admin not found", async () => {
      Admin.findOne.mockResolvedValue(null);

      await sendOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 500 if DB fails", async () => {
      Admin.findOne.mockRejectedValue(new Error("Mongo down"));

      await sendOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- VERIFY OTP ----------------
  describe("verifyOtpAndResetPassword", () => {
    it("should reset password if OTP valid", async () => {
      const mockAdmin = {
        otp: "123456",
        otpExpiry: Date.now() + 10000,
        save: jest.fn()
      };

      Admin.findOne.mockResolvedValue(mockAdmin);

      req.body = {
        email: "admin@test.com",
        otp: "123456",
        newPassword: "newpass"
      };

      await verifyOtpAndResetPassword(req, res);

      expect(mockAdmin.password).toBe("newpass");
      expect(mockAdmin.otp).toBeUndefined();
      expect(mockAdmin.otpExpiry).toBeUndefined();
      expect(res.json).toHaveBeenCalledWith({
        message: "Password reset successful"
      });
    });

    it("should reject wrong OTP", async () => {
      Admin.findOne.mockResolvedValue({
        otp: "111111",
        otpExpiry: Date.now() + 10000
      });

      req.body.otp = "222222";

      await verifyOtpAndResetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject expired OTP", async () => {
      Admin.findOne.mockResolvedValue({
        otp: "123456",
        otpExpiry: Date.now() - 1000
      });

      req.body.otp = "123456";

      await verifyOtpAndResetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ---------------- RESEND OTP ----------------
  describe("resendOtp", () => {
    it("should resend OTP", async () => {
      const mockAdmin = {
        save: jest.fn()
      };

      Admin.findOne.mockResolvedValue(mockAdmin);
      sendEmail.mockResolvedValue();

      req.body.email = "admin@test.com";

      await resendOtp(req, res);

      expect(mockAdmin.otp).toHaveLength(6);
      expect(sendEmail).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        msg: "New OTP sent to your email"
      });
    });

    it("should fail if email missing", async () => {
      await resendOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if admin not found", async () => {
      Admin.findOne.mockResolvedValue(null);
      req.body.email = "x@test.com";

      await resendOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
