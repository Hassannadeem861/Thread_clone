import User from "../models/user-model.js";
import { uploadFileOnCloudinary, deleteImg } from "../../cloudinary.js";
import fs from "fs"; // To remove local temp file
import nodemailer from "nodemailer";
// import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    // console.log("find user: ", user);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    // console.log("accessToken: ", accessToken);
    // console.log("refreshToken: ", refreshToken);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("GENERATE_ACCESS_AND_REFRESH_TOKEN: ", error);
  }
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "username, email, password are required" });
    }

    const existUser = await User.findOne({ email: email.toLowerCase() });
    // const existUser = await User.findOne({ $or: [{ email }, { username }] });
    // console.log("existUser: ", existUser);

    if (existUser) {
      return res
        .status(200)
        .json({ message: "Email already exist please try a another email" });
    }

    const pictureLocalPath = req.files?.profilePicture[0]?.path;
    // console.log("req.files: ", req.files);
    console.log("pictureLocalPath: ", pictureLocalPath);

    if (!pictureLocalPath) {
      return res.status(400).json({ message: "Profile picture is required" }); // Successfully created response dena
    }

    const userImage = await uploadFileOnCloudinary(pictureLocalPath);
    console.log("userImage: ", userImage);

    if (!userImage) {
      return res.status(400).json({ message: "Profile picture is required" }); // Successfully created response dena
    }

    const user = await User.create({
      username,
      email,
      password,
      userImage: userImage.url,
      userImage: userImage.public_id,
    });

    const createUser = await User.findById(user._id).select("-password");
    // console.log("createUser: ", createUser);

    if (!createUser) {
      return res
        .status(401)
        .json({ message: "Some thing went wrong while registering the user" });
    }

    return res
      .status(201)
      .json({ message: "Registration successfully", createUser });
  } catch (error) {
    console.log("REGISTER ERROR: ", error.message);
    return res
      .status(400)
      .json({ message: "REGISTER ERROR", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!(username || email)) {
      return res.status(400).json({ message: "All fields is required" });
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });
    // console.log("login user: ", user);

    if (!user) {
      return res.status(404).json({ message: "Please register first" });
    }

    const checkPassword = await user?.isPasswordCorrect(password);
    // console.log("checkPassword: ", checkPassword);

    if (!checkPassword) {
      return res.status(401).json({ message: "Invalid email and passowrd" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    // console.log(" accessToken: ", accessToken);
    // console.log(" refreshToken: ", refreshToken);

    const loggedInUser = await User.findOne(user._id).select("-refreshToken");

    const options = {
      httpOnly: true,
      secure: true,
      // expires: new Date(
      //   Date.now() + process.env.COOKIE_EXPIRY * 24 * 60 * 60 * 1000
      // ),
    };

    // console.log("options: ", options);

    // Send response with cookies
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        message: "Login successful",
        loggedInUser,
        accessToken,
        refreshToken,
      });
  } catch (error) {
    console.log("LOGIN ERROR: ", error.message);
    return res.status(400).json({
      message: "LOGIN ERROR",
      error: error.message,
    });
  }
};

const logout = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          accessToken: undefined,
        },
      },
      {
        new: true,
      }
    );
    console.log("logout user :", user);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({
        message: "Logout user succcessfully",
      });
  } catch (error) {
    console.log("LOGOUT ERROR: ", error.message);
    return res.status(400).json({
      message: "LOGOUT ERROR",
      err: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const user = await User.find();
    // console.log("logout user :", user);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Get all users succcessfully",
      user,
    });
  } catch (error) {
    console.log("GET ALL USERS ERROR: ", error.message);
    return res.status(400).json({
      message: "GET ALL USERS ERROR",
      error: error.message,
    });
  }
};

const getSingleUser = async (req, res) => {
  try {
    const id = req.params.id;
    // console.log("logout user :", user);

    if (!id) {
      return res.status(404).json({
        message: `User not found with ${req.params.id}`,
      });
    }

    const user = await User.findById(id)
      .select("-password")
      .populate("followers")
      .populate({
        path: "threads",
        populate: [
          ({ path: "likes" }, { path: "comments" }, { path: "admin" }),
        ],
      })
      .populate({ path: "replies", populate: { path: "admin" } })
      .populate({
        path: "reposts",
        populate: [
          ({ path: "likes" }, { path: "comments" }, { path: "admin" }),
        ],
      });

    console.log("user: ", user);

    return res.status(200).json({
      message: "Get all users succcessfully",
      user,
    });
  } catch (error) {
    console.log("GET SINGLE USER ERROR: ", error.message);
    return res.status(400).json({
      message: "GET SINGLE USER ERROR",
      error: error.message,
    });
  }
};

const followUser = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        message: "Id is required",
      });
    }

    const userExist = await User.findById(id);

    if (!userExist) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (userExist.followers.includes(req.user._id)) {
      await User.findByIdAndUpdate(
        userExist._id,
        { $pull: { followers: req.user._id } },
        { new: true }
      );

      return res.status(200).json({
        message: `Unfollow ${userExist.username}`,
      });
    } else {
      await User.findByIdAndUpdate(
        userExist._id,
        { $push: { followers: req.user._id } },
        { new: true }
      );
      return res.status(200).json({
        message: `Follow ${userExist.username}`,
      });
    }
  } catch (error) {
    console.log("FOLLOW USER ERROR: ", error.message);
    return res.status(200).json({
      message: "FOLLOW USER ERROR",
      error: error.message,
    });
  }
};

const searchUser = async (req, res) => {
  try {
    const query = req.params.query;

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).select("-password -refreshToken");

    return res.status(200).json({
      message: "Search user successfully",
      users,
    });
  } catch (error) {
    console.log("SEARCH USER ERROR: ", error.message);
    return res.status(400).json({
      message: "SEARCH USER ERROR",
      err: error.message,
    });
  }
};

const myInfo = async (req, res) => {
  try {
    return res.status(200).json({
      message: "Search user successfully",
      me: req.user,
    });
  } catch (error) {
    console.log("MY INFO ERROR: ", error.message);
    return res.status(400).json({
      message: "MY INFO ERROR",
      err: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;

    // Update only the provided fields
    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true }
    );

    // console.log("updatedUser: ", updatedUser);

    const user = await User.findById(updatedUser._id).select(
      "-password -refreshToken"
    );

    return res
      .status(201)
      .json({ message: "Update profile succesfully: ", user });
  } catch (error) {
    console.error("UPDATE USER PROFILE ERROR: :", error);
    return res.status(500).json({ message: "UPDATE USER PROFILE ERROR: " });
  }
};

const updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  // console.log("oldPassword, newPassword: ", req.body);

  // Check if both oldPassword and newPassword are provided
  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Old password and new password are required" });
  }

  const userId = req.params.id;
  // console.log("userId: ", userId);

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    // .select("+password");
    console.log("user: ", user);

    // If user is not found, return a 404 error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user has a password field
    if (!user.password) {
      return res
        .status(400)
        .json({ message: "User does not have a password set" });
    }

    const isMatch = await user?.isPasswordCorrect(oldPassword);
    console.log("isMatch : ", isMatch);

    // If the passwords do not match, return a 400 error
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    user.password = newPassword; // Directly set, let middleware hash it
    await user.save();

    // Updated user ko fetch karne aur refreshToken ko exclude karne ke liye
    const loggedInUser = await User.findById(user._id).select("-refreshToken");
    console.log("loggedInUser: ", loggedInUser);

    // Respond with success
    return res
      .status(200)
      .json({ message: "Password updated successfully", user });
  } catch (error) {
    console.error("Error updating password: ", error);
    res.status(500).json({ message: "Error updating password" });
  }
};

const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // console.log("forget password email: ", req.body);

    if (!email) {
      return res
        .status(400)
        .json({ message: "Please provide an email address" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    // console.log("forget password user: ", user);

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found. Please register first." });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, "Hassan", {
      expiresIn: "1h",
    });

    // const accessToken = await generateAccessAndRefreshTokens(user._id);

    // Set up nodemailer
    const transporter = nodemailer.createTransport({
      // host: "smtp.gmail.com",
      // port: 465,
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASSWORD,
      },
    });

    // Prepare email details
    const mailOptions = {
      from: "hr@techicoders.com",
      to: email,
      subject: "Password Reset Request",
      text: `Please click on the link to reset your password: ${process.env.SERVER_URL}/reset-password/${token}`,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Respond with success
    return res
      .status(200)
      .json({ message: "Password reset link has been sent to your email." });
  } catch (error) {
    console.error("Forget password error: ", error);
    return res
      .status(500)
      .json({ message: "An error occurred while processing your request." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const token = req.params.token;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Please provide a new token." });
    }

    if (!password) {
      return res
        .status(400)
        .json({ message: "Please provide a new password." });
    }

    if (password.length < 5) {
      return res
        .status(400)
        .json({ message: "Password must be at least 5 characters long." });
    }

    const decodedToken = jwt.verify(token, "Hassan");
    console.log("Decoded token:", decodedToken);

    const user = await User.findOne({ email: decodedToken.email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // const hashedPassword = await bcrypt.hash(password, 10);

    // user.password = hashedPassword;
    // await user.save();

    user.password = password; // Directly set, let middleware hash it
    await user.save();

    return res
      .status(200)
      .json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Reset password error" });
  }
  // // Handle token expiration or invalid token errors
  // if (error.name === "TokenExpiredError") {
  //   return res.status(400).json({
  //     message: "Token has expired. Please request a new password reset link.",
  //   });
  // } else if (error.name === "JsonWebTokenError") {
  //   return res.status(400).json({
  //     message: "Invalid token. Please request a new password reset link.",
  //   });
  // }
};

const refreshToken = async (req, res) => {
  try {
    const inCommingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;
    console.log("inCommingRefreshToken :", inCommingRefreshToken);

    if (!inCommingRefreshToken) {
      res.status(401).json({ message: "Unauthorized token" });
    }

    const decodedToken = jwt.verify(
      inCommingRefreshToken,
      process.env.REFRESH_TOKEN
    );
    console.log("decodedToken: ", decodedToken);

    const user = await User.findById(decodedToken._id);
    console.log("user: ", user);

    if (!user) {
      res.status(401).json({ message: "Invalid refresh token" });
    }

    if (inCommingRefreshToken !== user.refreshToken) {
      res.status(401).json({ message: "Refresh token is expired and use" });
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({ message: "Access token refresed" });
  } catch (error) {
    console.log("REFRSH TOKEN ERROR: ", error);
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

// Get user details --- ADMIN
const getUserDetails = async (req, res) => {
  try {
    const userData = await User.findById(req.user._id);

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findById(userData._id).select(
      "-password -refreshToken"
    );

    return res
      .status(200)
      .json({ message: "Get user details succesfully", user });
  } catch (error) {
    console.error("GET USER DETAILS ERROR: :", error);
    return res.status(500).json({ message: "GET USER DETAILS ERROR: " });
  }
};

// Get single user details --- ADMIN
const getSingleUserDetail = async (req, res) => {
  try {
    const userData = await User.findById(req.params.id);

    if (!userData) {
      return res
        .status(404)
        .json({ message: `User not found with ${req.params.id}` });
    }

    const user = await User.findById(userData._id).select(
      "-password -refreshToken"
    );

    return res
      .status(200)
      .json({ message: "Get single user details succesfully", user });
  } catch (error) {
    console.error("GET USER DETAILS ERROR: :", error);
    return res.status(500).json({ message: "GET USER DETAILS ERROR: " });
  }
};

// user update role --- ADMIN
const updateUserRole = async (req, res) => {
  try {
    const { username, email, role } = req.body;

    // Update only the provided fields
    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (role) updateFields.role = role;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    // console.log("updatedUser: ", updatedUser);

    const user = await User.findById(updatedUser._id).select(
      "-password -refreshToken"
    );

    return res
      .status(201)
      .json({ message: "Update profile succesfully: ", user });
  } catch (error) {
    console.error("UPDATE USER PROFILE ROLE ERROR: :", error);
    return res
      .status(500)
      .json({ message: "UPDATE USER PROFILE ROLE ERROR: " });
  }
};

// delete user --- ADMIN
const deleteUser = async (req, res) => {
  try {
    const userData = await User.findById(req.params.id);

    if (!userData) {
      return res
        .status(404)
        .json({ message: `User not found with ${req.params.id}` });
    }

    // Delete the order
    await User.deleteOne({ _id: req.params.id }); // Use deleteOne with the order ID

    return res
      .status(201)
      .json({ message: "Delete user succesfully: ", userData });
  } catch (error) {
    console.error("DELETE USER ERROR: :", error);
    return res.status(500).json({ message: "DELETE USER ERROR: " });
  }
};

export {
  register,
  login,
  logout,
  getAllUsers,
  getSingleUser,
  followUser,
  searchUser,
  myInfo,
  updateProfile,
  refreshToken,
  updatePassword,
  forgetPassword,
  resetPassword,
  getUserDetails,
  getSingleUserDetail,
  deleteUser,
  updateUserRole,
};
