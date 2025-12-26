// config/db.js
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        console.log('🔍 Checking MongoDB connection...');
        
        // Get connection string from .env or use default local
        const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hr-system';
        
        console.log(`Connecting to: ${mongoURI.replace(/mongodb:\/\/[^:]+:[^@]+@/, 'mongodb://***:***@')}`);
        
        // For LOCAL MongoDB (not Atlas)
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            // REMOVE directConnection for local MongoDB
            // family: 4 // Use IPv4
        };
        
        await mongoose.connect(mongoURI, options);
        
        console.log('✅ MongoDB Connected Successfully!');
        console.log(`📁 Database: ${mongoose.connection.name}`);
        console.log(`📍 Host: ${mongoose.connection.host}`);
        console.log(`🎯 Port: ${mongoose.connection.port}`);
        
        // Test connection with a ping
        await mongoose.connection.db.admin().ping();
        console.log('🏓 Database ping successful!');
        
    } catch (error) {
        console.error('❌ MongoDB Connection Failed!');
        console.error('Error details:', error.message);
        console.log('\n🔧 Quick Fixes:');
        console.log('1. Make sure MongoDB is running locally');
        console.log('2. Open a new CMD as Administrator and run:');
        console.log('   mongod --dbpath C:\\data\\db');
        console.log('3. Check your .env file MONGODB_URI');
        console.log('4. Try this connection string: mongodb://127.0.0.1:27017/hr-system');
        
        process.exit(1);
    }
};

module.exports = connectDB;