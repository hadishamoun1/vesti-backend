const { DataTypes } = require('sequelize');
const sequelize = require('../connection/connection'); // Adjust path as needed
const User = require('./User'); // Import User model

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ownerId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  location: {
    type: DataTypes.GEOMETRY('POINT')
  },
  pictureUrl: {
    type: DataTypes.TEXT
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Stores',
  timestamps: false
});

module.exports = Store;
