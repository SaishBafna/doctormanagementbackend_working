import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from "../controllers/admin/admin.product.controller.js";

import Product from "../models/Product.js";

jest.mock("../models/Product.js");

describe("Admin Product Controller", () => {
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
  describe("createProduct", () => {
    it("should create product successfully", async () => {
      const saveMock = jest.fn().mockResolvedValue();

      Product.mockImplementation(() => ({
        save: saveMock,
        name: "Oil"
      }));

      await createProduct(req, res);

      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Product created successfully",
        product: expect.any(Object)
      });
    });

    it("should return 400 if invalid data", async () => {
      Product.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error("Invalid"))
      }));

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ---------------- GET PRODUCTS ----------------
  describe("getProducts", () => {
    it("should return paginated products with summary", async () => {
      req.query = { search: "oil", page: "1", limit: "5" };

      Product.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ name: "Ayur Oil" }])
      });

      Product.countDocuments
        .mockResolvedValueOnce(1)  // filtered
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // inStock
        .mockResolvedValueOnce(2); // lowStock

      Product.distinct.mockResolvedValue(["Ayurvedic", "Herbal"]);

      await getProducts(req, res);

      expect(res.json).toHaveBeenCalledWith({
        summary: {
          totalMedicines: 10,
          inStock: 8,
          lowStock: 2,
          categories: 2
        },
        filteredCount: 1,
        page: 1,
        limit: 5,
        totalPages: 1,
        items: [{ name: "Ayur Oil" }]
      });
    });

    it("should return 500 on failure", async () => {
      Product.find.mockImplementation(() => {
        throw new Error("Mongo down");
      });

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- GET BY ID ----------------
  describe("getProductById", () => {
    it("should return a product", async () => {
      Product.findById.mockResolvedValue({ name: "Oil" });

      await getProductById({ params: { id: "1" } }, res);

      expect(res.json).toHaveBeenCalledWith({ name: "Oil" });
    });

    it("should return 404 if not found", async () => {
      Product.findById.mockResolvedValue(null);

      await getProductById({ params: { id: "1" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- UPDATE ----------------
  describe("updateProduct", () => {
    it("should update product", async () => {
      Product.findByIdAndUpdate.mockResolvedValue({ name: "Updated" });

      await updateProduct({ params: { id: "1" }, body: {} }, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Product updated successfully",
        product: { name: "Updated" }
      });
    });

    it("should return 404 if not found", async () => {
      Product.findByIdAndUpdate.mockResolvedValue(null);

      await updateProduct({ params: { id: "1" }, body: {} }, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- DELETE ----------------
  describe("deleteProduct", () => {
    it("should delete product", async () => {
      Product.findByIdAndDelete.mockResolvedValue({});

      await deleteProduct({ params: { id: "1" } }, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Product deleted successfully"
      });
    });

    it("should return 404 if not found", async () => {
      Product.findByIdAndDelete.mockResolvedValue(null);

      await deleteProduct({ params: { id: "1" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
