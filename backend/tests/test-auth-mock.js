const jwt = require('jsonwebtoken');

// Mock JWT verification
const createMockFirebaseToken = (uid = 'test-user-123', email = 'test@example.com') => {
    return jwt.sign(
        {
            uid,
            email,
            name: 'Test User',
            picture: 'https://example.com/photo.jpg',
            iss: 'https://securetoken.google.com/test-project',
            aud: 'test-project',
            auth_time: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000)
        },
        'test-secret',
        { 
            algorithm: 'HS256',
            header: {
                kid: 'test-kid-123'
            } 
        }
    );
};

module.exports = {
    createMockFirebaseToken
};