import dotenv from "dotenv";
import mongoose from "mongoose";
// import { DB_NAME } from "../contants.js";

// Load environment variables
dotenv.config();

const mongodbURI = process.env.MONGODB_URI
const connectDb = async () => {
  try {
    const connectionInstances = await mongoose.connect(mongodbURI);
    console.log(
      `/n MongoDB is connected !! DB HOST: ${connectionInstances.connection.host}`
    );
  } catch (error) {
    console.error("DATABASE CONNECTION FAILED", error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose is disconnected");
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("App is terminating");
  mongoose.connection.close(() => {
    console.log("Mongoose default connection closed");
    process.exit(0);
  });
});

export default connectDb;
