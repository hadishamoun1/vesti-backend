const sequelize = require("../connection/connection");
const User = require("./User");
const Store = require("./Store");
const Product = require("./Product");
const Order = require("./Order");
const OrderItem = require("./Order_Items");
const Notification = require("./Notifications");
const Discount = require("./Discounts");
const StoreCategory = require("./Store_Categories");

// User and Store Association
User.hasMany(Store, { foreignKey: "ownerId" });
Store.belongsTo(User, { foreignKey: "ownerId" });

// Store and Product Association
Store.hasMany(Product, { foreignKey: "storeId" });
Product.belongsTo(Store, { foreignKey: "storeId" });

// User and Order Association
User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "userId" });

// Store and Order Association
Store.hasMany(Order, { foreignKey: "storeId" });
Order.belongsTo(Store, { foreignKey: "storeId" });

// Order and OrderItem Association
Order.hasMany(OrderItem, { foreignKey: "orderId" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

// Product and OrderItem Association
Product.hasMany(OrderItem, { foreignKey: "productId" });
OrderItem.belongsTo(Product, { foreignKey: "productId" });

// User and Notification Association
User.hasMany(Notification, { foreignKey: "userId" });
Notification.belongsTo(User, { foreignKey: "userId" });

// Store and Notification Association
Store.hasMany(Notification, { foreignKey: "storeId" });
Notification.belongsTo(Store, { foreignKey: "storeId" });

// Store and Discount Association
Store.hasMany(Discount, { foreignKey: "storeId" });
Discount.belongsTo(Store, { foreignKey: "storeId" });

// Product and Discount Association
Product.hasMany(Discount, { foreignKey: "productId" });
Discount.belongsTo(Product, { foreignKey: "productId" });

// Store and StoreCategory Association
Store.hasMany(StoreCategory, { foreignKey: "storeId" });
StoreCategory.belongsTo(Store, { foreignKey: "storeId" });

// Notification and Discount Association
Notification.belongsTo(Discount, { foreignKey: "discountId" });
Discount.hasMany(Notification, { foreignKey: "discountId" });

module.exports = {
  User,
  Store,
  Product,
  Order,
  OrderItem,
  Notification,
  Discount,
  StoreCategory,
  sequelize,
};
