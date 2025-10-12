const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        })
    })
}

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'No token provided' 
            });
        }

        if (process.env.NODE_ENV === 'test') {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, 'test-secret');
                req.auth = {
                    uid: decoded.uid,
                    email: decoded.email,
                    displayName: decoded.name
                };
                return next();
            } catch (jwtError) {
                console.error('JWT verification error:', jwtError);
            }
        }

        const decodedToken = await admin.auth().verifyIdToken(token);

        req.auth = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            displayName: decodedToken.name
        };

        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ 
            success: false,
            message: 'Invalid token' 
        });
    }
}

module.exports = { verifyToken };