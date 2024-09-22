const { DataTypes } = require("sequelize");
const sequelize = require("../connection/connection"); // Adjust path as needed
const User = require("./User");
const Store = require("./Store");
const Discounts = require("./Discounts");

const Notification = sequelize.define("Notification", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
  },
  discountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Discounts,
      key: "id",
    },
  },
    storeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Store,
        key: "id",
      },
    },
    message: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
  tableName: "notifications",
  timestamps: false,
}
);

module.exports = Notification;
