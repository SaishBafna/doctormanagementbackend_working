import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateReturnStatus,
  deleteOrder
} from "../controllers/admin/admin.order.controller.js";

import Order from "../models/Order.js";

jest.mock("../models/Order.js");

describe("Admin Order Controller", () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, query: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- GET ALL ORDERS ----------------
  describe("getAllOrders", () => {
    it("should return paginated orders with summary & revenue", async () => {
      req.query = { page: "1", limit: "10", search: "ORD" };

      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ orderId: "ORD1" }])
      });

      Order.countDocuments
        .mockResolvedValueOnce(1)  // filtered
        .mockResolvedValueOnce(10) // totalOrders
        .mockResolvedValueOnce(4)  // completed
        .mockResolvedValueOnce(5)  // pending
        .mockResolvedValueOnce(1); // cancelled

      Order.aggregate.mockResolvedValue([{ totalRevenue: 5000 }]);

      await getAllOrders(req, res);

      expect(res.json).toHaveBeenCalledWith({
        summary: {
          totalOrders: 10,
          completedOrders: 4,
          pendingOrders: 5,
          cancelledOrders: 1,
          totalRevenue: 5000
        },
        filteredCount: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        orders: [{ orderId: "ORD1" }]
      });
    });

    it("should handle no revenue case", async () => {
      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      Order.countDocuments
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      Order.aggregate.mockResolvedValue([]);

      await getAllOrders(req, res);

      expect(res.json.mock.calls[0][0].summary.totalRevenue).toBe(0);
    });

    it("should return 500 on error", async () => {
      Order.find.mockImplementation(() => {
        throw new Error("DB error");
      });

      await getAllOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- GET BY ID ----------------
  describe("getOrderById", () => {
    it("should return an order", async () => {
      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ orderId: "ORD1" })
      });

      await getOrderById({ params: { id: "1" } }, res);

      expect(res.json).toHaveBeenCalledWith({ orderId: "ORD1" });
    });

    it("should return 404 if not found", async () => {
      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getOrderById({ params: { id: "1" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- UPDATE STATUS ----------------
  describe("updateOrderStatus", () => {
    it("should update order status & tracking", async () => {
      const mockOrder = {
        orderStatus: "Placed",
        trackingHistory: [],
        save: jest.fn().mockResolvedValue()
      };

      Order.findById.mockResolvedValue(mockOrder);

      req.params.id = "1";
      req.body = { status: "Shipped", note: "On way", location: "Delhi" };

      await updateOrderStatus(req, res);

      expect(mockOrder.orderStatus).toBe("Shipped");
      expect(mockOrder.trackingHistory.length).toBe(1);
      expect(res.json).toHaveBeenCalledWith({
        message: "Order status updated",
        order: mockOrder
      });
    });

    it("should return 404 if order missing", async () => {
      Order.findById.mockResolvedValue(null);

      await updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- RETURN STATUS ----------------
  describe("updateReturnStatus", () => {
    it("should update return request", async () => {
      const mockOrder = {
        returnHistory: [{ productId: "p1", status: "Pending" }],
        save: jest.fn().mockResolvedValue()
      };

      Order.findById.mockResolvedValue(mockOrder);

      req.params.id = "1";
      req.body = { productId: "p1", returnStatus: "Approved" };

      await updateReturnStatus(req, res);

      expect(mockOrder.returnHistory[0].status).toBe("Approved");
      expect(res.json).toHaveBeenCalledWith({
        message: "Return status updated",
        order: mockOrder
      });
    });

    it("should return 404 if return request missing", async () => {
      Order.findById.mockResolvedValue({ returnHistory: [] });

      await updateReturnStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- DELETE ----------------
  describe("deleteOrder", () => {
    it("should delete order", async () => {
      Order.findByIdAndDelete.mockResolvedValue({});

      await deleteOrder({ params: { id: "1" } }, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Order deleted successfully"
      });
    });

    it("should return 404 if order not found", async () => {
      Order.findByIdAndDelete.mockResolvedValue(null);

      await deleteOrder({ params: { id: "1" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
