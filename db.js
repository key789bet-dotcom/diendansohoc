const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     'localhost',
  user:     'gmsh',
  password: 'Gmsh@2026',
  database: 'diendansohoc',
  charset:  'utf8mb4',
  waitForConnections: true,
  connectionLimit:    10,
});

module.exports = pool;