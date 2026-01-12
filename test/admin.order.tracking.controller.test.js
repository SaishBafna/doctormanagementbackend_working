import {
  updateOrderStatus,
  getOrderTracking,
  updateReturnStatus,
  getReturnTracking
} from "../controllers/admin/admin.order.tracking.controller.js";

import Order from "../models/Order.js";

jest.mock("../models/Order.js");

describe("Admin Order Tracking Controller", () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => jest.clearAllMocks());

  // ---------------- UPDATE ORDER STATUS ----------------
  describe("updateOrderStatus", () => {
    it("should push status into trackingHistory", async () => {
      const mockOrder = {
        orderStatus: "Placed",
        trackingHistory: [],
        save: jest.fn()
      };

      Order.findById.mockResolvedValue(mockOrder);

      req.params.orderId = "1";
      req.body = { status: "Shipped", note: "On way", location: "Mumbai" };

      await updateOrderStatus(req, res);

      expect(mockOrder.trackingHistory.length).toBe(1);
      expect(mockOrder.orderStatus).toBe("Shipped");
      expect(res.json).toHaveBeenCalledWith({
        message: "Order status updated to Shipped",
        order: mockOrder
      });
    });

    it("should return 404 if order missing", async () => {
      Order.findById.mockResolvedValue(null);

      await updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- GET TRACKING ----------------
  describe("getOrderTracking", () => {
    it("should return order tracking", async () => {
      Order.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ orderId: "O1" })
      });

      await getOrderTracking({ params: { orderId: "1" } }, res);

      expect(res.json).toHaveBeenCalledWith({ orderId: "O1" });
    });

    it("should return 404 if not found", async () => {
      Order.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await getOrderTracking({ params: { orderId: "1" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- RETURN STATUS ----------------
  describe("updateReturnStatus", () => {
    it("should update return status", async () => {
      const mockOrder = {
        returnHistory: [{ productId: "p1", status: "Pending" }],
        save: jest.fn()
      };

      Order.findById.mockResolvedValue(mockOrder);

      req.body = { orderId: "1", productId: "p1", status: "Approved" };

      await updateReturnStatus(req, res);

      expect(mockOrder.returnHistory[0].status).toBe("Approved");
      expect(res.json).toHaveBeenCalledWith({
        message: "Return status updated",
        order: mockOrder
      });
    });

    it("should reject invalid status", async () => {
      req.body = { status: "Fake" };

      await updateReturnStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ---------------- RETURN TRACKING ----------------
  describe("getReturnTracking", () => {
    it("should push return tracking", async () => {
      const mockOrder = {
        items: [{ productId: "p1", name: "Oil", status: "returned" }],
        trackingHistory: [],
        save: jest.fn()
      };

      Order.findById.mockResolvedValue(mockOrder);

      req.body = { orderId: "1", productId: "p1" };

      await getReturnTracking(req, res);

      expect(mockOrder.trackingHistory.length).toBe(1);
      expect(res.json).toHaveBeenCalledWith({
        message: "Return tracking updated",
        order: mockOrder
      });
    });

    it("should reject if product not returned", async () => {
      const mockOrder = {
        items: [{ productId: "p1", status: "delivered" }]
      };

      Order.findById.mockResolvedValue(mockOrder);

      await getReturnTracking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
