
require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

// Middleware to read JSON data
app.use(express.json());

// Database connection
connectDB();

// Home route
app.get("/", (req, res) => {
    res.send("Inventory Management System API is Running!");
});

// Product routes
app.use("/api/products", productRoutes);

// Handle invalid routes (404)
app.use((req, res, next) => {
    const error = new Error("Route Not Found");
    error.statusCode = 404;
    next(error);
});

// Centralized error handling middleware
app.use(errorMiddleware);

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
