
const validateProduct = (req, res, next) => {
    const { name, category, sku, price, quantity, lowStockThreshold } = req.body;

    // Required fields validation
    if (
        !name ||
        !category ||
        !sku ||
        price === undefined ||
        quantity === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: "Name, category, SKU, price and quantity are required"
        });
    }

    // Name validation
    if (typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: "Product name must contain at least 2 characters"
        });
    }

    // Category validation
    if (typeof category !== "string" || !category.trim()) {
        return res.status(400).json({
            success: false,
            message: "Valid category is required"
        });
    }

    // SKU validation
    if (typeof sku !== "string" || !sku.trim()) {
        return res.status(400).json({
            success: false,
            message: "Valid SKU is required"
        });
    }

    // Price validation
    if (typeof price !== "number" || price < 0 || !Number.isFinite(price)) {
        return res.status(400).json({
            success: false,
            message: "Price must be a valid non-negative number"
        });
    }

    // Quantity validation
    if (!Number.isInteger(quantity) || quantity < 0) {
        return res.status(400).json({
            success: false,
            message: "Quantity must be a non-negative whole number"
        });
    }

    // Low stock threshold validation
    if (
        lowStockThreshold !== undefined &&
        (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0)
    ) {
        return res.status(400).json({
            success: false,
            message: "Low stock threshold must be a non-negative whole number"
        });
    }

    next();
};

module.exports = validateProduct;
