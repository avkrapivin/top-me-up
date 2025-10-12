const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;

        if (!mongoURI) {
            throw new Error('MONGO_URI is not defined in the environment variables');
        }

        console.log('Connecting to MongoDB:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide password in logs
        
        if (mongoose.connection.readyState === 0) {
            const conn = await mongoose.connect(mongoURI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log(`MongoDB Connected: ${conn.connection.host}`);
        } else {
            console.log('MongoDB already connected');
        }
        
    } catch (error) {
        console.error(`Database connection error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;