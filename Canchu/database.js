const mysql = require('mysql');
require('dotenv').config();
const { promisify } = require('util');
const POOL = mysql.createPool({
    host: process.env.RDS_ENDPOINT,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD
});
console.log(POOL);
// process.env.NODE_ENV ? process.env.DB_FOR_TEST : process.env.DB_NAME,
const QUERY = promisify(POOL.query).bind(POOL);

module.exports = {POOL, QUERY};
