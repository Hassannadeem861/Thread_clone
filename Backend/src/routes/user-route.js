import express from "express";
import {
  register,
  login,
  getAllUsers,
  getSingleUser,
  logout,
  followUser,
  searchUser,
  updateProfile,
  updatePassword,
  forgetPassword,
  resetPassword,
  myInfo
  // refreshToken,
  // getUserDetails,
  // getSingleUserDetail,
  // updateUserRole,
  // deleteUser
} from "../controllers/user-controller.js";
import {
  verifyToken,
  // adminRoleMiddleware,
} from "../middlewares/auth-middleware.js";
const router = express.Router();
import { upload } from "../middlewares/multer-middleware.js";

const uploadMiddleware = upload.fields([
  { name: "profilePicture", maxCount: 1 },
]);

router.post("/user/register", uploadMiddleware, register);
router.post("/user/login", login);
router.get("/get/all/users", verifyToken, getAllUsers);
router.get("/get/single/user/:id", verifyToken, getSingleUser);
router.post("/user/logout", logout);
router.put("/user/follower/:id", verifyToken, followUser);
router.get("/user/search/:query", verifyToken, searchUser);
router.put("/user/update-profile", verifyToken, updateProfile);
router.get("/user/my/info", verifyToken, myInfo);
router.put("/update-password/:id", verifyToken, updatePassword);
router.post("/forget-password", forgetPassword);
router.post("/reset-password/:token", resetPassword);
// router.post("/refresh-token", refreshToken);

//ADMIN ROUTE
// router.get(
//   "/admin/get-user-detial",
//   verifyToken,
//   adminRoleMiddleware("admin"),
//   getUserDetails
// );

// router.get(
//   "/admin/get-single-user-detial/:id",
//   verifyToken,
//   adminRoleMiddleware("admin"),
//   getSingleUserDetail
// );

// router.put(
//   "/admin/update-user-role/:id",
//   verifyToken,
//   adminRoleMiddleware("admin"),
//   updateUserRole
// );

// router.
// delete(
//   "/admin/delete-user/:id",
//   verifyToken,
//   adminRoleMiddleware("admin"),
//   deleteUser
// );

export default router;
