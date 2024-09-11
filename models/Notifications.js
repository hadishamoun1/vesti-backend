const { DataTypes } = require('sequelize');
const sequelize = require('../connection/connection'); // Adjust path as needed
const User = require('./User');
const Store = require('./Store');

const Notification = sequelize.define('Notification', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  discountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
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
}, {
  tableName: 'notifications',
  timestamps: false
});

module.exports = Notification;
