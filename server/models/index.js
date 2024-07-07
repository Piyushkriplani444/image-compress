"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(module.filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.json")[env];
const db = {};
const sequelizeObj = {};
const databases = Object.keys(config.databases);

// let sequelize;
// if (config.use_env_variable) {
//   sequelize = new Sequelize(process.env[config.use_env_variable], config);
// } else {
//   sequelize = new Sequelize(
//     config.database,
//     config.username,
//     config.password,
//     config
//   );
// }

for (let i = 0; i < databases.length; i += 1) {
  const database = databases[i];
  const dbPath = config.databases[database];
  sequelizeObj[i] = new Sequelize(
    dbPath.database,
    dbPath.username,
    dbPath.password,
    dbPath
  );
}

const getAllFiles = (dirPath, arrayOfFiles1) => {
  const files = fs.readdirSync(dirPath);

  let arrayOfFiles = arrayOfFiles1 || [];

  files.forEach((file) => {
    if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
      arrayOfFiles = getAllFiles(`${dirPath}/${file}`, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });
  return arrayOfFiles;
};

/** Add the Database Models* */
getAllFiles(`${__dirname}/../../server`)
  .filter(
    (file) =>
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-9) === ".model.js"
  )
  .forEach((file) => {
    const model = require(file)(sequelizeObj[0], Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelizeObj[0];
db.sequelize1 = sequelizeObj[1];
db.Sequelize = Sequelize;
module.exports = db;
