import {
  uploadUserAvatar,
  uploadDoctorImage,
  uploadProductImages,
  removeProductGalleryImages,
  uploadServiceImage,
  uploadPackageImage
} from "../controllers/admin/admin.upload.controller.js";

import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Product from "../models/Product.js";
import Service from "../models/Service.js";
import Package from "../models/Package.js";

import {
  uploadBuffer,
  uploadMany,
  deleteByPublicId
} from "../services/cloudinaryService.js";

jest.mock("../models/User.js");
jest.mock("../models/Doctor.js");
jest.mock("../models/Product.js");
jest.mock("../models/Service.js");
jest.mock("../models/Package.js");
jest.mock("../services/cloudinaryService.js");

describe("Admin Upload Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: "1" },
      file: { buffer: Buffer.from("img") },
      files: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    uploadBuffer.mockResolvedValue({
      secure_url: "img.jpg",
      public_id: "pid123"
    });

    uploadMany.mockResolvedValue([
      { url: "a.jpg", publicId: "a1" },
      { url: "b.jpg", publicId: "b2" }
    ]);
  });

  afterEach(() => jest.clearAllMocks());

  // ---------------- USER ----------------
  it("should upload user avatar", async () => {
    const user = {
      save: jest.fn(),
      avatarPublicId: "old"
    };
    User.findById.mockResolvedValue(user);

    await uploadUserAvatar(req, res);

    expect(deleteByPublicId).toHaveBeenCalledWith("old");
    expect(user.avatarUrl).toBe("img.jpg");
    expect(res.json).toHaveBeenCalled();
  });

  // ---------------- DOCTOR ----------------
  it("should upload doctor image", async () => {
    const doc = {
      save: jest.fn(),
      imagePublicId: "old"
    };
    Doctor.findById.mockResolvedValue(doc);

    await uploadDoctorImage(req, res);

    expect(deleteByPublicId).toHaveBeenCalledWith("old");
    expect(doc.image).toBe("img.jpg");
  });

  // ---------------- PRODUCT ----------------
  it("should upload product main + gallery images", async () => {
    const product = {
      images: [],
      imagesPublicIds: [],
      save: jest.fn()
    };

    Product.findById.mockResolvedValue(product);

    req.files = {
      mainImage: [{ buffer: Buffer.from("m") }],
      images: [{ buffer: Buffer.from("a") }, { buffer: Buffer.from("b") }]
    };

    await uploadProductImages(req, res);

    expect(product.mainImage).toBe("img.jpg");
    expect(product.images.length).toBe(2);
    expect(res.json).toHaveBeenCalled();
  });

  it("should remove product gallery images", async () => {
    const product = {
      images: ["a.jpg", "b.jpg"],
      imagesPublicIds: ["a1", "b2"],
      save: jest.fn()
    };

    Product.findById.mockResolvedValue(product);
    req.body = { publicIds: ["a1"] };

    await removeProductGalleryImages(req, res);

    expect(deleteByPublicId).toHaveBeenCalledWith("a1");
    expect(product.imagesPublicIds).toEqual(["b2"]);
  });

  // ---------------- SERVICE ----------------
  it("should upload service image", async () => {
    const service = { save: jest.fn() };
    Service.findById.mockResolvedValue(service);

    await uploadServiceImage(req, res);

    expect(service.image.url).toBe("img.jpg");
    expect(res.json).toHaveBeenCalled();
  });

  // ---------------- PACKAGE ----------------
  it("should upload package image", async () => {
    const pack = { save: jest.fn() };
    Package.findById.mockResolvedValue(pack);

    await uploadPackageImage(req, res);

    expect(pack.image.url).toBe("img.jpg");
    expect(res.json).toHaveBeenCalled();
  });
});
