
const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const validateProduct = require("../middleware/validateProduct");

const router = express.Router();

// Helper: Validate MongoDB Product ID
const validateId = (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid Product ID"
        });
    }
    next();
};

// Helper: Escape special regex characters
const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// 1. CREATE PRODUCT
router.post("/", validateProduct, async (req, res, next) => {
    try {
        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });
    } catch (error) {
        next(error);
    }
});

// 2. GET ALL PRODUCTS - FILTER, SORT, PAGINATION
router.get("/", async (req, res, next) => {
    try {
        const {
            category,
            search,
            minPrice,
            maxPrice,
            sortBy,
            order,
            page = "1",
            limit = "10"
        } = req.query;

        const filter = {};

        // Category filtering
        if (category !== undefined) {
            if (typeof category !== "string" || !category.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid category"
                });
            }

            filter.category = category.trim();
        }

        // Search products by name
        if (search !== undefined) {
            if (typeof search !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid search value"
                });
            }

            if (search.trim()) {
                filter.name = {
                    $regex: escapeRegex(search.trim()),
                    $options: "i"
                };
            }
        }

        // Price filtering
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};

            if (minPrice !== undefined) {
                const min = Number(minPrice);

                if (
                    typeof minPrice !== "string" ||
                    !minPrice.trim() ||
                    !Number.isFinite(min) ||
                    min < 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid minimum price"
                    });
                }

                filter.price.$gte = min;
            }

            if (maxPrice !== undefined) {
                const max = Number(maxPrice);

                if (
                    typeof maxPrice !== "string" ||
                    !maxPrice.trim() ||
                    !Number.isFinite(max) ||
                    max < 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid maximum price"
                    });
                }

                filter.price.$lte = max;
            }

            if (
                filter.price.$gte !== undefined &&
                filter.price.$lte !== undefined &&
                filter.price.$gte > filter.price.$lte
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Minimum price cannot exceed maximum price"
                });
            }
        }

        // Pagination validation
        const currentPage = Number(page);
        const pageLimit = Number(limit);

        if (
            typeof page !== "string" ||
            !/^[1-9]\d*$/.test(page) ||
            !Number.isSafeInteger(currentPage)
        ) {
            return res.status(400).json({
                success: false,
                message: "Page must be a positive whole number"
            });
        }

        if (
            typeof limit !== "string" ||
            !/^[1-9]\d*$/.test(limit) ||
            !Number.isSafeInteger(pageLimit) ||
            pageLimit > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Limit must be between 1 and 100"
            });
        }

        // Sorting validation
        const allowedSortFields = [
            "name",
            "price",
            "quantity",
            "createdAt"
        ];

        const sort = {};

        if (sortBy !== undefined) {
            if (
                typeof sortBy !== "string" ||
                !allowedSortFields.includes(sortBy)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid sort field"
                });
            }

            sort[sortBy] = order === "desc" ? -1 : 1;
        }

        if (
            order !== undefined &&
            !["asc", "desc"].includes(order)
        ) {
            return res.status(400).json({
                success: false,
                message: "Order must be either asc or desc"
            });
        }

        const products = await Product.find(filter)
            .sort(sort)
            .skip((currentPage - 1) * pageLimit)
            .limit(pageLimit);

        const totalProducts = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            totalProducts,
            currentPage,
            totalPages: Math.ceil(totalProducts / pageLimit),
            products
        });
    } catch (error) {
        next(error);
    }
});

// 3. STOCK ADJUSTMENT - RESTOCK / SALE
router.patch("/:id/stock", validateId, async (req, res, next) => {
    try {
        const { type, quantity } = req.body;

        if (!["restock", "sale"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Type must be either restock or sale"
            });
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive whole number"
            });
        }

        const filter = { _id: req.params.id };

        // Prevent selling more stock than available
        if (type === "sale") {
            filter.quantity = { $gte: quantity };
        }

        const change = type === "restock"
            ? quantity
            : -quantity;

        // Atomic update
        const product = await Product.findOneAndUpdate(
            filter,
            { $inc: { quantity: change } },
            { new: true, runValidators: true }
        );

        if (!product) {
            const exists = await Product.exists({
                _id: req.params.id
            });

            if (!exists) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }

            return res.status(400).json({
                success: false,
                message: "Insufficient stock available"
            });
        }

        res.status(200).json({
            success: true,
            message: `Stock ${type} successful`,
            product
        });
    } catch (error) {
        next(error);
    }
});

// 4. LOW STOCK ALERT REPORT
router.get("/reports/low-stock", async (req, res, next) => {
    try {
        const products = await Product.find({
            $expr: {
                $lte: ["$quantity", "$lowStockThreshold"]
            }
        }).sort({ quantity: 1 });

        res.status(200).json({
            success: true,
            message: "Low stock report generated successfully",
            totalLowStockProducts: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
});

// 5. CATEGORY-WISE INVENTORY SUMMARY
router.get("/reports/category-summary", async (req, res, next) => {
    try {
        const summary = await Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    totalProducts: { $sum: 1 },
                    totalQuantity: { $sum: "$quantity" },
                    totalInventoryValue: {
                        $sum: {
                            $multiply: ["$price", "$quantity"]
                        }
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            message: "Category-wise inventory summary generated successfully",
            summary
        });
    } catch (error) {
        next(error);
    }
});

// 6. GET SINGLE PRODUCT BY ID
router.get("/:id", validateId, async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        next(error);
    }
});

// 7. UPDATE PRODUCT
router.put("/:id", validateId, validateProduct, async (req, res, next) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });
    } catch (error) {
        next(error);
    }
});

// 8. DELETE PRODUCT
router.delete("/:id", validateId, async (req, res, next) => {
    try {
        const product = await Product.findByIdAndDelete(
            req.params.id
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
