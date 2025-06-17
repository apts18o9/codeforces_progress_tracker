// server/app.js

const express = require('express');
const cors = require('cors'); // For enabling Cross-Origin Resource Sharing
require('dotenv').config(); // Load environment variables

const studentRoutes = require('./routes/studentRoutes');
const { startCronJob } = require('./utils/cronJob'); // Import cron job starter

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes (adjust as needed for production)
app.use(express.json()); // Body parser for JSON data

// API Routes
app.use('/api/students', studentRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.send('Student Progress Management System Backend is running!');
});

// Start the cron job when the application starts
startCronJob();

module.exports = app;

