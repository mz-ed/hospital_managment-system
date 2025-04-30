const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'mysqlpass', // Replace with your MariaDB password
  database: process.env.DB_DATABASE || 'patient_management',
});

// Initialize database
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        age INT NOT NULL,
        gender VARCHAR(10) NOT NULL,
        contact VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// API Routes

// Get all patients with sorting
app.get('/api/patients', async (req, res) => {
  try {
    const { sort = 'id', order = 'ASC' } = req.query;
    
    // Validate sort field
    const allowedSortFields = ['id', 'name', 'age', 'gender', 'created_at'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'id';
    
    // Validate order
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    const [patients] = await pool.query(
      `SELECT * FROM patients ORDER BY ${sortField} ${sortOrder}`
    );
    
    res.json(patients);
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add new patient
app.post('/api/patients', async (req, res) => {
  try {
    const { name, age, gender, contact, address } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO patients (name, age, gender, contact, address) VALUES (?, ?, ?, ?, ?)',
      [name, age, gender, contact, address]
    );

    res.status(201).json({
      id: result.insertId,
      name, age, gender, contact, address
    });
  } catch (err) {
    console.error('Error adding patient:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Start server and handle port conflict
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at: http://localhost:${PORT}/api/patients`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Trying another port...`);
      const newPort = 3001; // You can also make this dynamic if needed
      app.listen(newPort, () => {
        console.log(`Server running on port ${newPort}`);
        console.log(`API available at: http://localhost:${newPort}/api/patients`);
      });
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
