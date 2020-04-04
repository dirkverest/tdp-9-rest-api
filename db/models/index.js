'use strict';

const Sequelize = require('sequelize');
// Check current process’s environment:
const env = process.env.NODE_ENV || 'development';
// Select seeting for current process’s environment:
const config = require(__dirname + '/../../config/config.json')[env];
// Access and interact with the file system:
const fs = require('fs');
// Work with file and directory paths:
const path = require('path');
// current module file's absolute path to filter out the index file:
const basename = path.basename(__filename);
// Database object:
const db = {};


// Instantiate an instance of the Sequelize class to use fsjstd-restapi.db
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Check this scripts directory for table models
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});


// Complete and export db module
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;