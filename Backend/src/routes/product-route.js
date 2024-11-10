import express from "express";
import {
  addProduct,
  getAllProductsDetails,
  updateProduct,
  updateProductImage,
  deleteProduct,
  getSingleProductDetails,
} from "../controllers/product-controller.js";
import {
  verifyToken,
  adminRoleMiddleware,
} from "../middlewares/auth-middleware.js";
import { upload } from "../middlewares/multer-middleware.js";
const router = express.Router();

const uploadMiddleware = upload.fields([{ name: "productImage", maxCount: 1 }]);

router.post(
  "/add-product",
  verifyToken,
  adminRoleMiddleware("admin"),
  uploadMiddleware,
  addProduct
);
router.get("/get-all-products", getAllProductsDetails);
router.get("/get-single-product/:id", getSingleProductDetails);
router.put(
  "/update-product/:id",
  verifyToken,
  adminRoleMiddleware("admin"),
  updateProduct
);
router.put(
  "/update-product-image/:id",
  verifyToken,
  adminRoleMiddleware("admin"),
  uploadMiddleware,
  updateProductImage
);
router.delete(
  "/delete-product/:id",
  verifyToken,
  adminRoleMiddleware("admin"),
  deleteProduct
);



export default router;
