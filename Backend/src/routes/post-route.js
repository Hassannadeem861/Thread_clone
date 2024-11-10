import express from "express";
import {
  addPost,
  getAllPosts,
  deletePost,
  likePost
} from "../controllers/post-controller.js";
import {
  verifyToken,
  // adminRoleMiddleware,
} from "../middlewares/auth-middleware.js";
import { upload } from "../middlewares/multer-middleware.js";

const uploadMiddleware = upload.fields([{ name: "media", maxCount: 1 }]);

const router = express.Router();
router.post("/create-post", verifyToken, uploadMiddleware, addPost);
router.get("/get-all-post", verifyToken, getAllPosts);
router.delete("/delete-post/:id", verifyToken, deletePost);
router.put("/post-like/:id", verifyToken, likePost);

export default router;
