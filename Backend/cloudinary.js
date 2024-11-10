import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadFileOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("response in cloudinary: ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log("error in cloudinary: ", error.message);
    //Jo temporary file local system mein save hui thi, usay hata do kyunke upload kaamyaab nahi hua
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export const deleteImg = async (publicId) => {
  try {
    const response = await cloudinary.uploader.destroy(publicId);
    console.log("deleteImg", response);
    return response;
  } catch (error) {
    console.log("delete image in cloudinary :", error);
    return null;
  }
};

// export { uploadFileOnCloudinary, deleteImg }
