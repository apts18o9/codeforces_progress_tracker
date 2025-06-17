// server/server.js

const app = require('./app');
const connectDB = require('./config/db');
require('dotenv').config(); // Ensure environment variables are loaded for the whole app

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the backend at http://localhost:${PORT}`);
});

