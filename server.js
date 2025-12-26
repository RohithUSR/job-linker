// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/db');

// // Import routes
// const hrRoutes = require('./routes/hrRoutes');
// const jobRoutes = require('./routes/jobRoutes');
// const applicationRoutes = require('./routes/applicationRoutes');

// const app = express();

// // Connect to database
// connectDB();

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Routes
// app.use('/api/hrs', hrRoutes);
// app.use('/api/jobs', jobRoutes);
// app.use('/api/applications', applicationRoutes);

// // Health check
// app.get('/health', (req, res) => {
//     res.json({ status: 'OK', message: 'RecruitFlow API is running' });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ message: 'Something went wrong!' });
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });

// server.js
const express = require('express');
const cors = require('cors'); // npm install cors
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// CORS Configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'], // React/Vite default ports
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
async function connectDB() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/';
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        process.exit(1);
    }
}

// Import routes
const hrRoutes = require('./routes/hrRoutes');
app.use('/api/hr', hrRoutes);

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend is working!',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = process.env.PORT || 5001;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Backend running on: http://localhost:${PORT}`);
    });
});