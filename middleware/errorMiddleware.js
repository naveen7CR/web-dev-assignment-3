
const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack || err.message);

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // MongoDB validation error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((error) => error.message)
            .join(", ");
    }

    // Invalid MongoDB Object ID
    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid Product ID or field value";
    }

    // Duplicate SKU error
    if (err.code === 11000) {
        statusCode = 409;
        message = "Product with this SKU already exists";
    }

    res.status(statusCode).json({
        success: false,
        message: message
    });
};

module.exports = errorMiddleware;
