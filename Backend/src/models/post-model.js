import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    text: {
      type: String,
    },

    media: {
      type: String,
      required: false,
    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);
export default Post;
