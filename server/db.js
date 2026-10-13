// db.js
// This file creates a CONNECTION POOL to MySQL.
// A connection pool keeps several database connections open and ready,
// so we don't have to open/close a new connection for every request.
// We use mysql2's promise-based API so we can use async/await in routes.

// Load environment variables from the .env file into process.env
const dotenv = require('dotenv');
dotenv.config();

// Import the mysql2 library
const mysql = require('mysql2');

// Create the connection pool using values from .env
const pool = mysql.createPool({
    host:     process.env.DB_HOST,      // usually 'localhost'
    user:     process.env.DB_USER,      // your MySQL username
    password: process.env.DB_PASSWORD,  // your MySQL password
    database: process.env.DB_NAME,      // 'event_management'
    waitForConnections: true,           // wait instead of throwing error when all connections busy
    connectionLimit:    10,             // maximum 10 connections open at once
    queueLimit:         0               // unlimited queued requests
});

// .promise() returns a version of pool that works with async/await
// (instead of old-style callbacks)
module.exports = pool.promise();
