import productSchema from "../models/products-model.js";
import { uploadFileOnCloudinary, deleteImg } from "../../cloudinary.js";
import fs from "fs"; // To remove local temp file
import ApiFeature from "../utils/apiFeatures.js";
// import cloudinary from "cloudinary"; // Make sure Cloudinary is configured correctly

// Create admin route
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stock,
      nameOfReviews,
      reviews,
      rating,
      // userId,
    } = req.body;
    // console.log("name, description, password, role :", req.body);

    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !stock ||
      !nameOfReviews
      // !reviews
    ) {
      return res.status(403).json({ message: "Required parameters missing" });
    }

    const productLocalPath = req.files?.productImage[0]?.path;
    // console.log("req.files: ", req.files);
    console.log("productLocalPath: ", productLocalPath);

    if (!productLocalPath) {
      return res.status(400).json({ message: "Product image is required" }); // Successfully created response dena
    }

    const productImage = await uploadFileOnCloudinary(productLocalPath);
    console.log("productImage: ", productImage);

    if (!productImage) {
      return res.status(400).json({ message: "Product image is required" }); // Successfully created response dena
    }

    const productCreated = await productSchema.create({
      name,
      description,
      price,
      category,
      stock,
      nameOfReviews,
      reviews,
      rating,
      // userId,
      productImage: productImage.url,
      // productImage: productImage.publicId,
    });
    // console.log("productCreated: ", productCreated);

    res
      .status(201)
      .json({ message: "Product created Successfully", productCreated }); // Successfully created response dena
  } catch (error) {
    console.log("Error in creating product", error);
    res.status(500).json({ error: "Error in creating product" });
  }
};

// const getAllProductsDetails = async (req, res, next) => {
//   try {
//     const getAllProducts = await productSchema.find();
//     res
//       .status(200)
//       .json({ message: "Get all products successfully", getAllProducts });
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching resumes" });
//   }
// };

const getAllProductsDetails = async (req, res, next) => {
  try {
    const resultParPage = 5;
    const productCount = await productSchema.countDocuments();
    const apiFeature = new ApiFeature(productSchema.find(), req.query)
      .search()
      .filter()
      .pagination(resultParPage);
    const getAllProducts = await apiFeature.query;
    // console.log("getAllProducts: ", getAllProducts);

    if (!Array.isArray(getAllProducts) || !getAllProducts.length) {
      return res.status(404).json({ message: "No products found" });
    }

    res
      .status(200)
      .json({ message: "Get all products successfully", getAllProducts });
  } catch (error) {
    console.log("ERROR IN GET ALL PRODUCTS: ", error);
    res.status(500).json({ error: "Error fetching products" });
  }
};

const getSingleProductDetails = async (req, res, next) => {
  try {
    const productId = req.params.id;

    const findProduct = await productSchema.findById(productId);
    console.log("findProduct: ", findProduct);

    if (!findProduct) {
      res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get single product successfully",
      findProduct,
      productCount,
    }); // Data response mein send karo
  } catch (error) {
    console.log("ERROR IN GET SINGLE PRODUCT: ", error);
    res.status(500).json({ error: "Error deleting product" });
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const id = req.params.id; // URL se resume ID lena
    if (!id) {
      res.status(404).json({ message: "Product not found" }); // Response mein updated resume dena
    }
    const updatedProduct = await productSchema.findByIdAndUpdate(id, req.body, {
      new: true,
    }); // Update the resume
    res
      .status(200)
      .json({ message: "Product updated successfully", updatedProduct }); // Response mein updated resume dena
  } catch (error) {
    res.status(500).json({ error: "Error updating product" });
  }
};

const updateProductImage = async (req, res, next) => {
  try {
    const id = req.params.id;

    // Pehle existing resume ko find karo
    const existingProductImg = await productSchema.findById(id);

    if (!existingProductImg) {
      return res.status(404).json({ message: "Product image not found" });
    }

    // Agar image update karni hai (agar nayi file hai)
    if (req.files?.productImage && req.files.productImage[0]) {
      const productLocalPath = req.files.productImage[0].path;
      console.log("New productLocalPath: ", productLocalPath);

      // Pehle purani image ko Cloudinary se delete karo
      if (existingProductImg.productImage) {
        const publicId = existingProductImg.productImage
          .split("/")
          .pop()
          .split(".")[0];
        console.log("publicId: ", publicId);

        const deleteResponse = await deleteImg(publicId);
        console.log("Image delete response: ", deleteResponse);
      }

      // Nayi image ko Cloudinary par upload karo
      const newProductImage = await uploadFileOnCloudinary(productLocalPath);
      console.log("New resumeImage URL: ", newProductImage.url);

      if (!newProductImage) {
        return res.status(400).json({ message: "Product image upload failed" });
      }

      // Temp file ko delete karne se pehle check karo agar file exist karti hai ya nahi
      if (fs.existsSync(productLocalPath)) {
        fs.unlinkSync(productLocalPath); // Temp file ko remove karo
        console.log("Temporary file deleted");
      } else {
        console.log("Temporary file not found, skipping deletion.");
      }

      // Nayi image ko update karo
      existingProductImg.productImage = newProductImage.url;
    }

    // Save the updated resume
    const updatedProduct = await existingProductImg.save();
    console.log("Updated Product image: ", updatedProduct);

    // Success response
    res
      .status(200)
      .json({ message: "Product img updated successfully", updatedProduct });
  } catch (error) {
    console.log("Error in updating product", error);
    res.status(500).json({ error: "Error updating product" });
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      res.status(200).json({ message: "Product not found" });
    }
    const productDel = await productSchema.findByIdAndDelete(id);
    res
      .status(200)
      .json({ message: "Product deleted successfully", productDel });
  } catch (error) {
    console.log("ERROR IN DELETE PRODUCT: ", error);
    res.status(500).json({ error: "Error deleting product" });
  }
};

export {
  addProduct,
  getAllProductsDetails,
  updateProduct,
  updateProductImage,
  deleteProduct,
  getSingleProductDetails,
};
