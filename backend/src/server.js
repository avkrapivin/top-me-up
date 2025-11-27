const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

// Security middleware
app.use(helmet());

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://topmeupweb.com',
    'https://www.topmeupweb.com',
    process.env.FRONTEND_URL,
    process.env.BACKEND_URL?.replace('/api', '')
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.some(allowed => {
            if (!allowed) return false;
            const originHost = origin.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
            const allowedHost = allowed.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
            return originHost === allowedHost || origin === allowed;
        });
        
        if (isAllowed) {
            callback(null, true);
        } else {
            if (process.env.NODE_ENV !== 'production') {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10Mb' }));
app.use(express.urlencoded({ extended: true, limit: '10Mb' }));

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'TopMeUp API is running!',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
    server.close(async () => console.log('Server closed'));
    await mongoose.disconnect();
    process.exit(0);
})

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
module.exports.server = server;