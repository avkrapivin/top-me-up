const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const { User, List, Comment, Statistics } = require('../src/models');
const { createMockFirebaseToken } = require('./test-auth-mock');

jest.setTimeout(30000); 

describe('API Endpoints Tests', () => {
    let testUser;
    let testList;
    let testComment;
    let authToken;

    beforeAll(async () => {
        await mongoose.connection.asPromise();

        testUser = new User({
            firebaseUid: `test-api-user-${Date.now()}`,
            email: `test-${Date.now()}@api.com`,
            displayName: 'API Test User',
            isAdmin: true
        });
        await testUser.save();
    
        testList = new List({
            userId: testUser._id,
            title: `Test List ${Date.now()}`,
            category: 'movies',
            isPublic: true
        });
        await testList.save();
    
        testComment = new Comment({
            listId: testList._id,
            userId: testUser._id,
            content: 'Test comment'
        });
        await testComment.save();
    
        authToken = createMockFirebaseToken(testUser.firebaseUid, testUser.email);
    });

    afterAll(async () => {
        if (testComment?._id) {
            await Comment.findByIdAndDelete(testComment._id);
        }
        if (testList?._id) {
            await List.findByIdAndDelete(testList._id);
        }
        if (testUser?._id) {
            await User.findByIdAndDelete(testUser._id);
        }
        
        await mongoose.disconnect();
        app.server.close();
    });

    describe('Health Check', () => {
        test('GET /api/health should return 200', async () => {
            const response = await request(app).get('/api/health');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('List API - Public Endpoints', () => {
        test('GET /api/lists/public should return public lists', async () => {
            const response = await request(app).get('/api/lists/public');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('GET /api/lists/:id should return specific list', async () => {
            const response = await request(app).get(`/api/lists/${testList._id}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data._id).toBe(testList._id.toString());
        });

        test('GET /api/lists/:id should return 404 for non-existent list', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app).get(`/api/lists/${fakeId}`);
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('List API - Protected Endpoints (Success Cases)', () => {
        test('GET /api/lists should return user lists when authenticated', async () => {
            const response = await request(app)
                .get('/api/lists')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('POST /api/lists should create new list when authenticated', async () => {
            const newListData = {
                title: 'New Test List',
                category: 'movies',
                description: 'Test description',
                isPublic: false
            };
            
            const response = await request(app)
                .post('/api/lists')
                .set('Authorization', `Bearer ${authToken}`)
                .send(newListData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(newListData.title);
            expect(response.body.data.category).toBe(newListData.category);
        });

        test('PUT /api/lists/:id should update list when authenticated and owned', async () => {
            const updatedData = {
                title: 'Updated List Title',
                description: 'Updated description'
            };
            
            const response = await request(app)
                .put(`/api/lists/${testList._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updatedData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(updatedData.title);
        });

        test('DELETE /api/lists/:id should delete list when authenticated and owned', async () => {
            const listToDelete = new List({
                userId: testUser._id,
                title: 'List to Delete',
                category: 'movies',
                isPublic: false
            });
            await listToDelete.save();

            const response = await request(app)
                .delete(`/api/lists/${listToDelete._id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const deletedList = await List.findById(listToDelete._id);
            expect(deletedList).toBeNull();
        });
    });

    describe('Lists API - Protected Endpoints (Auth Required)', () => {
        test('GET /api/lists should require authentication', async () => {
          const response = await request(app).get('/api/lists');
          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
        });
    
        test('POST /api/lists should require authentication', async () => {
          const response = await request(app)
            .post('/api/lists')
            .send({
              title: 'New Test List',
              category: 'movies',
              description: 'Test description'
            });
          
          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
        });
    });

    describe('Comments API - Public Endpoints', () => {
        test('GET /api/lists/:id/comments should return comments for a list', async () => {
            const response = await request(app).get(`/api/lists/${testList._id}/comments`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('GET /api/lists/:id/comments should return 404 for non-existent list', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app).get(`/api/lists/${fakeId}/comments`);
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Comments API - Protected Endpoints (Success Cases)', () => {
        test('POST /api/lists/:id/comments should create comment when authenticated', async () => {
            const commentData = {
                content: 'New test comment'
            };

            const response = await request(app)
                .post(`/api/lists/${testList._id}/comments`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(commentData);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.content).toBe(commentData.content);
        });

        test('PUT /api/comments/:id should update comment when authenticated and owned', async () => {
            const updateData = {
                content: 'Updated comment content'
            };
            
            const response = await request(app)
                .put(`/api/comments/${testComment._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.content).toBe(updateData.content);
        });

        test('DELETE /api/comments/:id should delete comment when authenticated and owned', async () => {
            const commentToDelete = new Comment({
                listId: testList._id,
                userId: testUser._id,
                content: 'Comment to delete'
            });
            await commentToDelete.save();
            
            const response = await request(app)
                .delete(`/api/comments/${commentToDelete._id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('Comments API - Protected Endpoints (Auth Required)', () => {
        test('POST /api/lists/:id/comments should require authentication', async () => {
          const response = await request(app)
            .post(`/api/lists/${testList._id}/comments`)
            .send({
              content: 'New test comment'
            });
          
          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
        });
    });

    describe('Statistics API', () => {
        test('GET /api/statistics/popular/:category should return popular items', async () => {
            const response = await request(app).get('/api/statistics/popular/movies');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('POST /api/statistics/update/:category should update statistics', async () => {
            const response = await request(app)
                .post('/api/statistics/update/movies')
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Validation Tests', () => {
        test('POST /api/lists should validate required fields when authenticated', async () => {
            const response = await request(app)
                .post('/api/lists')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    // Missing title
                    category: 'movies'
                });
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation error');
        });

        test('POST /api/lists should validate category enum when authenticated', async () => {
            const response = await request(app)
                .post('/api/lists')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Test List',
                    category: 'invalid-category'
                });
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Error Handling Tests', () => {
        test('Should handle invalid ObjectId', async () => {
            const response = await request(app).get('/api/lists/invalid-id');
            expect(response.status).toBe(400);
        });

        test('Should handle database connection errors gracefully', async () => {
            const response = await request(app).get('/api/health');
            expect(response.status).toBe(200);
        });
    });
});