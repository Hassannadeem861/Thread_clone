import express from "express";
import {
  createOrder,
  myOrder,
  getSingleOrder,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";
import {
  verifyToken,
  adminRoleMiddleware,
} from "../middlewares/auth-middleware.js";
// import { upload } from "../middlewares/multer-middleware.js";
const router = express.Router();

// const uploadMiddleware = upload.fields([{ name: "productImage", maxCount: 1 }]);

router.post("/create-order", verifyToken, createOrder);
router.get("/get-single-order/:id", verifyToken, getSingleOrder);
router.get("/get-login-user-order", verifyToken, myOrder);

// ADMIN ROUTE //
router.get(
  "/get-all-orders",
  verifyToken,
  adminRoleMiddleware("admin"),
  getAllOrders
);

router.put(
  "/update-stock-status/:id",
  verifyToken,
  adminRoleMiddleware("admin"),
  updateOrderStatus
);

router.delete(
  "/delete-order/:id",
  verifyToken,
  adminRoleMiddleware("admin"),
  deleteOrder
);

export default router;
