import User from "../models/user-model.js";
import Comment from "../models/comment-model.js";
import Post from "../models/post-model.js";
import mongoose from "mongoose";

const addComment = async (req, res) => {
  try {
    const id = req.params.id;
    const { text } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Id is required" });
    }

    if (!text) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const postExist = await Post.findById(id);
    if (!postExist) {
      return res.status(404).json({ message: "Comment is required" });
    }

    const createComment = await Comment.create({
      text,
      admin: req.user._id,
      post: postExist._id,
    });

    await Post.findByIdAndUpdate(
      id,
      { $push: { comments: createComment._id } },
      { new: true }
    );
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { replies: createComment._id } },
      { new: true }
    );

    return res
      .status(201)
      .json({ message: "Comment created Successfully", createComment });
  } catch (error) {
    console.log("ERROR IN ADD COMMENT", error.message);
    return res
      .status(400)
      .json({ message: "ERROR IN ADD COMMENT", err: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { postId, id } = req.params;

    if (!postId || !id) {
      return res
        .status(201)
        .json({ message: "postId and commentId is required" });
    }

    const postExist = await Post.findById(postId);
    if (!postExist) {
      return res.status(404).json({ message: "Post not found" });
    }

    const commentExist = await Comment.findById(id);
    if (!commentExist) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const newId = new mongoose.Types.ObjectId(id);
    if (postExist.comments.includes(newId)) {
      const id1 = commentExist.admin._id.toString();
    //   console.log("id1: ",id1);
      
      const id2 = req.user._id.toString();
    //   console.log("id2: ",id2);

      if (id1 !== id2) {
        return res
          .status(400)
          .json({ message: "You are not allowed to delete this comment" });
      }
    }

    await Post.findByIdAndUpdate(
      postId,
      { $pull: { comments: id } },
      { new: true }
    );

    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { replies: id } },
      { new: true }
    );

    const deleteComment = await Comment.findByIdAndDelete(id);
    return res
      .status(201)
      .json({ message: "Comment deleted Successfully", deleteComment });
  } catch (error) {
    console.log("ERROR IN DELETE COMMENT", error.message);
    return res
      .status(400)
      .json({ message: "ERROR IN DELETE COMMENT", err: error.message });
  }
};
export { addComment, deleteComment };
