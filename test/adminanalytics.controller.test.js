import { getAnalytics } from "../controllers/admin/adminanalytics.controller.js";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

jest.mock("../models/Doctor.js");
jest.mock("../models/User.js");
jest.mock("../models/Product.js");
jest.mock("../models/Order.js");

describe("Admin Analytics Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return full analytics data successfully", async () => {
    // Mock counts
    User.countDocuments.mockResolvedValue(10);
    Doctor.countDocuments.mockResolvedValue(5);
    Product.countDocuments.mockResolvedValue(20);
    Order.countDocuments.mockResolvedValue(50);

    // Mock total income aggregation
    Order.aggregate
      .mockResolvedValueOnce([{ total: 10000 }]) // income
      .mockResolvedValueOnce([                   // ordersPerDay
        { _id: "2026-01-01", count: 5 },
        { _id: "2026-01-02", count: 10 }
      ])
      .mockResolvedValueOnce([                   // ordersPerStatus
        { _id: "pending", count: 20 },
        { _id: "completed", count: 30 }
      ])
      .mockResolvedValueOnce([                   // topProducts
        { name: "Apple", category: "Fruits", totalSold: 15 }
      ]);

    await getAnalytics(req, res);

    expect(res.json).toHaveBeenCalledWith({
      totals: {
        users: 10,
        doctors: 5,
        products: 20,
        orders: 50,
        income: 10000
      },
      ordersPerDay: [
        { _id: "2026-01-01", count: 5 },
        { _id: "2026-01-02", count: 10 }
      ],
      ordersPerStatus: [
        { _id: "pending", count: 20 },
        { _id: "completed", count: 30 }
      ],
      topProducts: [
        { name: "Apple", category: "Fruits", totalSold: 15 }
      ]
    });
  });

  it("should return income 0 when no successful orders exist", async () => {
    User.countDocuments.mockResolvedValue(0);
    Doctor.countDocuments.mockResolvedValue(0);
    Product.countDocuments.mockResolvedValue(0);
    Order.countDocuments.mockResolvedValue(0);

    Order.aggregate
      .mockResolvedValueOnce([])   // income empty
      .mockResolvedValueOnce([])   // ordersPerDay
      .mockResolvedValueOnce([])   // ordersPerStatus
      .mockResolvedValueOnce([]);  // topProducts

    await getAnalytics(req, res);

    expect(res.json).toHaveBeenCalledWith({
      totals: {
        users: 0,
        doctors: 0,
        products: 0,
        orders: 0,
        income: 0
      },
      ordersPerDay: [],
      ordersPerStatus: [],
      topProducts: []
    });
  });

  it("should return 500 when database throws error", async () => {
    User.countDocuments.mockRejectedValue(new Error("DB failure"));

    await getAnalytics(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Server error",
      error: "DB failure"
    });
  });

  it("should call aggregate with correct number of times", async () => {
    User.countDocuments.mockResolvedValue(1);
    Doctor.countDocuments.mockResolvedValue(1);
    Product.countDocuments.mockResolvedValue(1);
    Order.countDocuments.mockResolvedValue(1);

    Order.aggregate
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await getAnalytics(req, res);

    expect(Order.aggregate).toHaveBeenCalledTimes(4);
  });
});
