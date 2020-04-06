'use strict';
const {Model, DataTypes} = require('sequelize');

module.exports = (sequelize) => {
    class User extends Model {}

    User.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        firstName: {
            type: DataTypes.STRING
        },
        lastName: {
            type: DataTypes.STRING
        },
        emailAddress: {
            type: DataTypes.STRING,
            // Though I validate using express-validator I also want the db to be able to validate the unique value
            unique: true
        },
        password: {
            type: DataTypes.STRING
        }
    }, {
        sequelize,
        timestamps: true
    });

    // Define associations between Course and User
    User.associate = (models) => {
        User.hasMany(models.Course, {
            foreignKey: {
                fieldName: 'userId',
                allowNull: false
            }
        });
    };

    return User;

};