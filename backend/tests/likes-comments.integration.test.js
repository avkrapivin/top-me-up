const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const { User, List, Comment } = require('../src/models');
const { createMockFirebaseToken } = require('./test-auth-mock');

jest.setTimeout(30000);

describe('Likes API integration', () => {
    let owner;
    let participant;
    let ownerToken;
    let participantToken;
    let publicList;
    let publicComment;
    let deletedComment;

    beforeAll(async () => {
        await Promise.all([
            User.deleteMany({}),
            List.deleteMany({}),
            Comment.deleteMany({})
        ]);

        owner = await User.create({
            firebaseUid: 'likes-owner',
            email: 'owner@example.com',
            displayName: 'Owner'
        });

        participant = await User.create({
            firebaseUid: 'likes-user',
            email: 'user@example.com',
            displayName: 'User'
        });

        publicList = await List.create({
            userId: owner._id,
            title: 'Public list',
            category: 'movies',
            isPublic: true
        });

        publicComment = await Comment.create({
            listId: publicList._id,
            userId: participant._id,
            content: 'Great list!'
        });

        deletedComment = await Comment.create({
            listId: publicList._id,
            userId: participant._id,
            content: 'Old comment',
            isDeleted: true
        });

        ownerToken = createMockFirebaseToken(owner.firebaseUid, owner.email);
        participantToken = createMockFirebaseToken(participant.firebaseUid, participant.email);
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
        app.server.close();
    });

    test('user can like a public list once', async () => {
        const response = await request(app)
            .post(`/api/lists/${publicList._id}/like`)
            .set('Authorization', `Bearer ${participantToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.likesCount).toBe(1);
        expect(response.body.data.userHasLiked).toBe(true);
    });

    test('repeated like does not duplicate entry', async () => {
        const response = await request(app)
            .post(`/api/lists/${publicList._id}/like`)
            .set('Authorization', `Bearer ${participantToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.likesCount).toBe(1);
    });

    test('owner cannot like own list', async () => {
        const response = await request(app)
            .post(`/api/lists/${publicList._id}/like`)
            .set('Authorization', `Bearer ${ownerToken}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test('user can remove like from list', async () => {
        const response = await request(app)
            .delete(`/api/lists/${publicList._id}/like`)
            .set('Authorization', `Bearer ${participantToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.likesCount).toBe(0);
        expect(response.body.data.userHasLiked).toBe(false);
    });

    test('liking a deleted comment is forbidden', async () => {
        const response = await request(app)
            .post(`/api/comments/${deletedComment._id}/like`)
            .set('Authorization', `Bearer ${participantToken}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test('unauthorized user cannot like a list', async () => {
        const res = await request(app).post(`/api/lists/${publicList._id}/like`);
        expect(res.status).toBe(401);
    });

    test('repeated unlike does not cause error', async () => {
        const response = await request(app)
            .delete(`/api/lists/${publicList._id}/like`)
            .set('Authorization', `Bearer ${participantToken}`);
    
        expect(response.status).toBe(200);
        expect(response.body.data.likesCount).toBe(0);
    });

    test('user can like a public comment', async () => {
        const response = await request(app)
            .post(`/api/comments/${publicComment._id}/like`)
            .set('Authorization', `Bearer ${participantToken}`);
    
        expect(response.status).toBe(200);
        expect(response.body.data.likesCount).toBe(1);
        expect(response.body.data.userHasLiked).toBe(true);
    });
});