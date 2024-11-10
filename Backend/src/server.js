import express from "express";
import cors from "cors";
// import morgan from "morgan";
import cookieParser from "cookie-parser";

import connectDB from "./db/db.js";

// Create an instance of the express application
const app = express();

connectDB();

// CORS options
const corsOptions = {
  // origin: "http://localhost:8081",
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
};

// Use CORS middleware with specified options
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.static("public"));
// app.use(morgan("dev"));

import userRoute from "./routes/user-route.js";
import postRoute from "./routes/post-route.js";
import commentRoute from "./routes/comment-route.js";


app.use("/api/v1", userRoute);
app.use("/api/v1", postRoute);
app.use("/api/v1", commentRoute);

// Set port and listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
