require('dotenv').config({ path: '../.env'});
const mongoose = require('mongoose');
const { User, List, Comment, Statistics } = require('../src/models');

async function testModels() {
    let connection;

    try {
        const testURI = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI.replace('topmeup', 'topmeup_test');
        connection = await mongoose.connect(testURI);
        console.log('Connected to MongoDB');

        // Clean up database
        await Promise.all([
            User.deleteMany({}),
            List.deleteMany({}),
            Comment.deleteMany({}),
            Statistics.deleteMany({})
        ]);
        console.log('Test database cleaned');

        // Create test user
        const testUser = new User({
            firebaseUid: 'test-uid-123',
            email: 'test@example.com',
            displayName: 'Test User'
        });
        await testUser.save();
        console.log('Test user created:', testUser);

        // Create test list
        const testList = new List({
            userId: testUser._id,
            title: 'Test List',
            category: 'movies',
            items: [{
                externalId: '123',
                title: 'Test Movie',
                position: 1,
                category: 'movies',
                cachedData: {
                    posterUrl: 'https://example.com/poster.jpg',
                    year: 2023,
                    genres: ['Action', 'Adventure'],
                    rating: 8.5,
                    description: 'A great test movie'
                }
            }]
        });
        await testList.save();
        console.log('Test list created:', testList);

        // Create test comment
        const testComment = new Comment({
            listId: testList._id,
            userId: testUser._id,
            content: 'This is a test comment'
        });
        await testComment.save();
        console.log('Test comment created:', testComment);

        // Create test statistics
        const testStats = new Statistics({
            date: new Date(),
            category: 'movies',
            popularItems: [{
                externalId: '123',
                title: 'Test Movie',
                count: 1,
                posterUrl: 'https://example.com/poster.jpg'
            }],
            totalLists: 1,
            totalItems: 1,
            totalLikes: 0,
            totalViews: 0
        });
        await testStats.save();
        console.log('Test statistics created:', testStats);

        // Validate test user
        try {
            const invalidUser = new User({
                firebaseUid: 'test-uid-123', // Duplicate
                email: 'test@example.com', // Duplicate
                displayName: 'Test User'
            });
            await invalidUser.save();
            console.log('Duplicate user should not be saved');
        } catch (error) {
            console.log('Validation error expected:', error.message);
        }

        // Test of methods
        await testList.addLike(testUser._id);
        console.log('Test list liked by user');

        await testList.incrementViews();
        console.log('Test list views incremented');

        // Test cached data
        const savedList = await List.findById(testList._id);
        console.log('Cached data preserved:', {
            posterUrl: savedList.items[0].cachedData.posterUrl,
            year: savedList.items[0].cachedData.year,
            genres: savedList.items[0].cachedData.genres
        })

        console.log('All models working correctly');
    } catch (error) {
        console.error('Model test failed:', error.message);
    } finally {
        if (connection) {
            await connection.disconnect();
            console.log('Disconnected from test database');
        }
    }
}

testModels();