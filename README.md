
# Inventory and Data Management System

## Assignment 3 - Web Development Lab

A RESTful Inventory Management API developed using Node.js, Express.js, MongoDB, and Mongoose.

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- dotenv
- Nodemon

## Features

1. Create products with validation
2. View all products
3. Filter products by category, name, and price
4. Sort products by name, price, quantity, or date
5. Pagination support
6. Get product by ID
7. Update product information
8. Delete products
9. Restock and sell products
10. Low-stock alert report
11. Category-wise inventory summary using aggregation
12. Centralized error handling

## Installation

Install dependencies:

npm install

Create a .env file:

PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/inventoryDB

Start the local MongoDB server, then run:

npm run dev

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/products | Create product |
| GET | /api/products | Get all products |
| GET | /api/products/:id | Get product by ID |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |
| PATCH | /api/products/:id/stock | Restock or sell |
| GET | /api/products/reports/low-stock | Low-stock report |
| GET | /api/products/reports/category-summary | Category summary |

## Example Product

{
  "name": "Laptop",
  "category": "Electronics",
  "sku": "LAP001",
  "price": 55000,
  "quantity": 10,
  "lowStockThreshold": 5
}

## Author

Naveen Kumar Singh
B.Tech Computer Science and Engineering
# web-dev-assignment-3
