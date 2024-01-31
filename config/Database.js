const { Sequelize } = require("sequelize");
 
const db = new Sequelize('project_jani', 'root', '', {
    host: "localhost",
    dialect: "mysql",
    logging: console.log
});
 
module.exports =  db;