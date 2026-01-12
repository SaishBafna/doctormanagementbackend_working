import {
  exportUsers,
  exportDoctors,
  exportProducts,
  exportOrders
} from "../controllers/admin/admin.export.controller.js";

import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { Parser } from "json2csv";

jest.mock("../models/User.js");
jest.mock("../models/Doctor.js");
jest.mock("../models/Product.js");
jest.mock("../models/Order.js");
jest.mock("json2csv");

describe("Admin Export Controller", () => {
  let res;

  beforeEach(() => {
    res = {
      header: jest.fn(),
      attachment: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    Parser.mockImplementation(() => ({
      parse: jest.fn().mockReturnValue("csv-data")
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- USERS ----------------
  it("should export users as CSV", async () => {
    User.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            userCode: "U1",
            name: "John",
            email: "john@test.com",
            isVerified: true,
            userDiscount: 10,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ])
      })
    });

    await exportUsers({}, res);

    expect(res.header).toHaveBeenCalledWith("Content-Type", "text/csv");
    expect(res.attachment).toHaveBeenCalledWith("users.csv");
    expect(res.send).toHaveBeenCalledWith("csv-data");
  });

  it("should return 404 if no users found", async () => {
    User.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      })
    });

    await exportUsers({}, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "No users found" });
  });

  // ---------------- DOCTORS ----------------
  it("should export doctors as CSV", async () => {
    Doctor.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          doctorId: "D1",
          name: "Dr A",
          specialty: "Cardio",
          reviews: [{ rating: 5 }, { rating: 3 }],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])
    });

    await exportDoctors({}, res);

    expect(res.attachment).toHaveBeenCalledWith("doctors.csv");
    expect(res.send).toHaveBeenCalledWith("csv-data");
  });

  it("should return 404 if no doctors found", async () => {
    Doctor.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([])
    });

    await exportDoctors({}, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  // ---------------- PRODUCTS ----------------
  it("should export products as CSV", async () => {
    Product.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            productId: "P1",
            name: "Oil",
            images: ["a.jpg", "b.jpg"],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ])
      })
    });

    await exportProducts({}, res);

    expect(res.attachment).toHaveBeenCalledWith("products.csv");
    expect(res.send).toHaveBeenCalledWith("csv-data");
  });

  it("should return 404 if no products found", async () => {
    Product.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      })
    });

    await exportProducts({}, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  // ---------------- ORDERS ----------------
  it("should export orders as CSV", async () => {
    Order.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([
        {
          orderId: "O1",
          userId: { name: "John", email: "john@test.com" },
          totalPrice: 100,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])
    });

    await exportOrders({}, res);

    expect(res.attachment).toHaveBeenCalledWith("orders.csv");
    expect(res.send).toHaveBeenCalledWith("csv-data");
  });

  it("should return 500 on order export error", async () => {
    Order.find.mockRejectedValue(new Error("Mongo crash"));

    await exportOrders({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Server error",
      error: "Mongo crash"
    });
  });
});
