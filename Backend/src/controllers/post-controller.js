import User from "../models/user-model.js";
import Comment from "../models/comment-model.js";
import Post from "../models/post-model.js";
import { uploadFileOnCloudinary, deleteImg } from "../../cloudinary.js";
import fs from "fs"; // To remove local temp file
import mongoose from "mongoose";


const addPost = async (req, res) => {
  try {
    const { text } = req.body;

    const mediaLocalPath = req.files?.media[0]?.path;
    console.log("req.files: ", req.files);
    console.log("mediaLocalPath: ", mediaLocalPath);

    if (!mediaLocalPath) {
      return res.status(400).json({ message: "Media image is required" }); // Successfully created response dena
    }

    const mediaImage = await uploadFileOnCloudinary(mediaLocalPath);
    console.log("mediaImage: ", mediaImage);

    if (!mediaImage) {
      return res.status(400).json({ message: "Media image is required" }); // Successfully created response dena
    }

    const createPost = await Post.create({
      text,
      image: mediaImage.url,
      admin: req.user._id,
    });
    console.log("createPost: ", createPost);

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: { threads: createPost._id },
      },
      { new: true }
    );

    return res
      .status(201)
      .json({ message: "Post created Successfully", createPost }); // Successfully created response dena
  } catch (error) {
    console.log("ERROR IN CREATE POST", error.message);
    return res
      .status(400)
      .json({ message: "ERROR IN CREATE POST", err: error.message });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const { page } = req.query;
    let pageNumber = page;

    if (!page || !page === undefined) {
      pageNumber = 1;
    }

    const findAllPost = await Post.find()
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * 3)
      .limit(3)
      .populate({ path: "likes", select: "-password" })
      .populate({ path: "admin", select: "-password" })
      //   .populate("likes")
      //   .populate("admin")
      .populate({
        path: "comments",
        populate: {
          path: "admin",
          model: "User",
        },
      });

    // if (findAllPost.length === 0) {
    //   return res.status(404).json({ message: "Post not found" });
    // }

    return res
      .status(201)
      .json({ message: "Get all post Successfully", findAllPost }); // Successfully created response dena
  } catch (error) {
    console.log("ERROR IN GET ALL POST", error.message);
    return res
      .status(400)
      .json({ message: "ERROR IN GET ALL POST", err: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: "Id is reqired" });
    }

    const userExist = await Post.findById(id);

    if (!userExist) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user._id.toString();
    console.log("userId: ", userId);

    const adminId = userExist.admin._id.toString();
    console.log("adminId: ", adminId);

    if (userId !== adminId) {
      return res
        .status(400)
        .json({ message: "You are not allowed to delete this post" });
    }

    if (req.files?.media && req.files.media[0]) {
      const mediaImageLocalPath = req.files.media[0].path;
      console.log("New mediaImageLocalPath: ", mediaImageLocalPath);

      // Pehle purani image ko Cloudinary se delete karo
      if (userExist.media) {
        const publicId = existingResume.media.split("/").pop().split(".")[0];
        console.log("publicId: ", publicId);

        const deleteResponse = await deleteImg(publicId);
        console.log("Image delete response: ", deleteResponse);
      }

      // Temp file ko delete karne se pehle check karo agar file exist karti hai ya nahi
      if (fs.existsSync(mediaImageLocalPath)) {
        fs.unlinkSync(mediaImageLocalPath); // Temp file ko remove karo
        console.log("Temporary file deleted");
      } else {
        console.log("Temporary file not found, skipping deletion.");
      }
    }

    const allComments = await Post.deleteMany({
      _id: { $in: userExist.comments },
    });
    console.log("allComments: ", allComments);
    const alltThreads = await User.updateMany(
      {
        $or: [{ threads: id }, { reposts: id }, { replies: id }],
      },
      {
        $pull: {
          threads: id,
          reposts: id,
          replies: id,
        },
      },
      {
        new: true,
      }
    );
    console.log("alltThreads : ", alltThreads);

    await Post.findByIdAndDelete(id);

    return res.status(201).json({ message: "Post deleted" });
  } catch (error) {
    console.log("ERROR IN DELETE POST", error.message);
    return res
      .status(400)
      .json({ message: "ERROR IN DELETE POST", err: error.message });
  }
};

const likePost = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: "Id is reqired" });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.likes.includes(req.user._id)) {
      await Post.findByIdAndUpdate(
        id,
        { $pull: { likes: req.user._id } },
        { new: true }
      );
      return res.status(200).json({
        message: `Post unliked`,
      });
    } else {
      await Post.findByIdAndUpdate(
        id,
        { $push: { likes: req.user._id } },
        { new: true }
      );

      return res.status(200).json({
        message: `Post liked`,
      });
    }
  } catch (error) {
    console.log("LIKE POST ERROR: ", error.message);
    return res.status(400).json({
      message: "LIKE POST ERROR",
      err: error.message,
    });
  }
};

const rePost = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: "Id is reqired" });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newId = new mongoose.Schema.Types.ObjectId(id);
    // console.log("newId :", newId);

    if (req.user.reposts.includes(newId)) {
      return res.status(400).json({
        message: `This post is already reposted`,
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { reposts: post._id } },
      { new: true }
    );

    return res.status(200).json({
      message: `Reposted successfully`,
      post,
      user,
    });
  } catch (error) {
    console.log("REPOST ERROR: ", error.message);
    return res.status(400).json({
      message: "REPOST ERROR",
      err: error.message,
    });
  }
};

const getSinglePost = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: "Id is reqired" });
    }

    const post = await Post.findById(id)

      .populate({ path: "admin", select: "-password -refreshToken" })
      .populate({ path: "likes", select: "-password" })
      .populate({
        path: "comments",
        populate: {
          path: "admin",
        },
      });

    return res.status(200).json({
      message: `Single post fetched successfully`,
      post
    });
  } catch (error) {
    console.log("SINGLE POST ERROR: ", error.message);
    return res.status(400).json({
      message: "SINGLE POST ERROR",
      err: error.message,
    });
  }
};

export { addPost, getAllPosts, deletePost, likePost, rePost, getSinglePost };
