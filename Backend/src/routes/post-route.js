import express from "express";
import {
  addPost,
  getAllPosts,
  deletePost,
  likePost,
  rePost,
  getSinglePost,
} from "../controllers/post-controller.js";
import { verifyToken } from "../middlewares/auth-middleware.js";
import { upload } from "../middlewares/multer-middleware.js";

const uploadMiddleware = upload.fields([{ name: "media", maxCount: 1 }]);

const router = express.Router();
router.post("/create-post", verifyToken, uploadMiddleware, addPost);
router.get("/get-all-post", verifyToken, getAllPosts);
router.delete("/delete-post/:id", verifyToken, deletePost);
router.put("/post-like/:id", verifyToken, likePost);
router.put("/repost/:id", verifyToken, rePost);
router.get("/get-single-post/:id", verifyToken, getSinglePost);

export default router;
