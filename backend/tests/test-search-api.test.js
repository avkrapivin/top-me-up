const request = require('supertest');
const app = require('../src/server');
const searchService = require('../src/services/searchService');
const mongoose = require('mongoose');
const { ValidationError, NotFoundError } = require('../src/utils/errors');

jest.setTimeout(30000); 

jest.mock('../src/services/searchService');

jest.mock('../src/middleware/rateLimiter', () => ({
    searchLimiter: (req, res, next) => next(),
    authLimiter: (req, res, next) => next(),
    generalLimiter: (req, res, next) => next()
}));

describe('Search API Tests', () => {
    beforeEach(() => {      
        jest.clearAllMocks();
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        app.server.close();
    })

    const createMockSearchResult = (category, id = 1, title = 'Test Item') => ({
        category,
        query: 'test',
        results: [{
            externalId: id,
            title,
            posterUrl: 'test.jpg',
            category
        }],
        totalPages: 1,
        page: 1
    });

    const createMockDetails = (category, id = 1, title = 'Test Item') => ({
        externalId: id,
        title,
        posterUrl: 'test.jpg',
        year: 2023,
        category
    });

    const testCategories = ['movies', 'music', 'games'];

    testCategories.forEach(category => {
        describe(`GET /api/search/${category}`, () => {
            test(`Should search ${category} successfully`, async () => {
                const mockResult = createMockSearchResult(category);
                searchService.search.mockResolvedValue(mockResult);
    
                const response = await request(app)
                    .get(`/api/search/${category}`)
                    .query({ q: 'test' });
    
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.category).toBe(category);
                expect(response.body.data.results).toHaveLength(1);
            });
    
            test(`Should return 400 for missing query in ${category}`, async () => {
                const response = await request(app)
                    .get(`/api/search/${category}`);

                searchService.search.mockRejectedValue(new ValidationError('Query must be at least 2 characters long'));
                
                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
    
            test(`Should return 400 for short query in ${category}`, async () => {
                const response = await request(app)
                    .get(`/api/search/${category}`)
                    .query({ q: 'a' });

                searchService.search.mockRejectedValue(new ValidationError('Query must be at least 2 characters long'));
    
                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
    
            test(`Should handle search error in ${category}`, async () => {
                searchService.search.mockRejectedValue(new Error('API Error'));
    
                const response = await request(app)
                    .get(`/api/search/${category}`)
                    .query({ q: 'test' });
    
                expect(response.status).toBe(500);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('API Error');
            });
        });
    
        describe(`GET /api/search/${category}/details/:id`, () => {
            test('Should get movie details successfully', async () => {
                const mockDetails = createMockDetails(category);
                searchService.getDetails.mockResolvedValue(mockDetails);
    
                const response = await request(app)
                    .get(`/api/search/${category}/details/1`);
    
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.title).toBe('Test Item');
            });
    
            test(`Should return 404 for non-existent item in ${category}`, async () => {
                searchService.getDetails.mockRejectedValue(new NotFoundError(category, '999'));
    
                const response = await request(app)
                    .get(`/api/search/${category}/details/999`);
    
                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });

            test(`Should handle getDetails error in ${category}`, async () => {
                searchService.getDetails.mockRejectedValue(new Error('API Error'));

                const response = await request(app)
                    .get(`/api/search/${category}/details/1`);

                expect(response.status).toBe(500);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('API Error');
            });
        });
    
        describe(`GET /api/search/${category}/genres`, () => {
            test(`Should get ${category} genres successfully`, async () => {
                const mockGenres = [
                    { id: 1, name: 'Action' },
                    { id: 2, name: 'Comedy' }
                ];
    
                searchService.getGenres.mockResolvedValue(mockGenres);
    
                const response = await request(app)
                    .get(`/api/search/${category}/genres`);
    
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.genres).toHaveLength(2);
            });

            test(`Should handle getGenres error in ${category}`, async () => {
                searchService.getGenres.mockRejectedValue(new Error('API Error'));

                const response = await request(app)
                    .get(`/api/search/${category}/genres`);

                expect(response.status).toBe(500);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('API Error');
            });
        });
    });

    describe('GET /api/search/games/platforms', () => {
        test('Should get game platforms successfully', async () => {
            const mockPlatforms = [
                { id: 1, name: 'PC' },
                { id: 2, name: 'PlayStation' }
            ];

            searchService.getPlatforms.mockResolvedValue(mockPlatforms);

            const response = await request(app)
                .get('/api/search/games/platforms');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.platforms).toHaveLength(2);
        });

        test('Should handle getPlatforms error', async () => {
            searchService.getPlatforms.mockRejectedValue(new Error('API Error'));

            const response = await request(app)
                .get('/api/search/games/platforms');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('API Error');
        });
    });

    describe('GET /api/search/movies/popular', () => {
        test('Should get popular movies successfully', async () => {
            const mockResults = {
                results: [
                    { externalId: 1, title: 'Popular Movie', posterUrl: 'test.jpg' }
                ],
                totalPages: 1,
                page: 1
            };

            searchService.getPopular.mockResolvedValue(mockResults);

            const response = await request(app)
                .get('/api/search/movies/popular');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.results).toHaveLength(1);
        });

        test('Should handle getPopular error', async () => {
            searchService.getPopular.mockRejectedValue(new Error('API Error'));

            const response = await request(app)
                .get('/api/search/movies/popular');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('API Error');
        });
    });

    describe('Unsupported category', () => {
        test('Should return 400 for unsupported category', async () => {
            searchService.getDetails.mockRejectedValue(new ValidationError('Unsupported category: unsupported'));

            const response = await request(app)
                .get('/api/search/unsupported/details/1');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('Should return 400 for unsupported category in search', async () => {
            searchService.getDetails.mockRejectedValue(new ValidationError('Unsupported category: unsupported'));

            const response = await request(app)
                .get('/api/search/unsupported/details/1');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});