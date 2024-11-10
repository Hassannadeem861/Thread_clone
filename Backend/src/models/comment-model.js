import mongoose from "mongoose";

const commentSchema = mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },

    text: {
      type: String,
    },
  },
  
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
