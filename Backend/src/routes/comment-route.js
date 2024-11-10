import express from "express";
import { addComment,deleteComment } from "../controllers/comment-controller.js";
import { verifyToken } from "../middlewares/auth-middleware.js";

const router = express.Router();
router.post("/create-comment/:id", verifyToken, addComment);
router.delete("/delete-comment/:postId/:id", verifyToken, deleteComment);

export default router;
