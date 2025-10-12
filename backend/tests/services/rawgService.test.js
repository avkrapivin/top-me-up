const RawgService = require('../../src/services/external/rawgService');

jest.mock('../../src/services/external/baseService');
jest.mock('../../src/utils/cache');

describe('RAWGService Tests', () => {
    let rawgService;
    let mockMakeRequest;

    beforeEach(() => {
        jest.clearAllMocks();
        rawgService = new RawgService();

        rawgService.config = {
            baseUrl: 'https://api.rawg.io/api',
            endpoints: {
                search: '/games',
                details: '/games',
                genres: '/genres',
                platforms: '/platforms'
            }
        };

        mockMakeRequest = jest.fn();
        rawgService.makeRequest = mockMakeRequest;
    });

    const createMockGame = (id = 1, name = 'Test Game') => ({
        id,
        name,
        background_image: 'test.jpg',
        released: '2023-01-01',
        rating: 4.5,
        rating_count: 100,
        genres: [{ id: 1, name: 'Action' }],
        platforms: [{ id: 1, name: 'PC' }]
    });

    describe('Search', () => {
        test('Should search games successfully', async () => {
            const mockGame = createMockGame();
            const mockData = {
                results: [mockGame],
                count: 1
            };
            
            mockMakeRequest.mockResolvedValue(mockData);

            const result = await rawgService.search('test', { page: 1, pageSize: 20 });

            expect(result).toBeDefined();
            expect(result.results).toHaveLength(1);
            expect(result.results[0].title).toBe('Test Game');
        });

        test('Should handle search error', async () => {
            mockMakeRequest.mockRejectedValue(new Error('API Error'));

            await expect(rawgService.search('test')).rejects.toThrow();
        });

        test('Should handle empty search results', async () => {
            const mockData = {
                results: [],
                count: 0
            };

            mockMakeRequest.mockResolvedValue(mockData);

            const result = await rawgService.search('nonexistent', { page: 1, pageSize: 20 });

            expect(result).toBeDefined();
            expect(result.results).toHaveLength(0);
            expect(result.totalResults).toBe(0);
        });
    });

    describe('getDetails', () => {
        test('Should get game details successfully', async () => {
            const mockGame = createMockGame();
            mockMakeRequest.mockResolvedValue(mockGame);

            const result = await rawgService.getDetails('1');

            expect(result).toBeDefined();
            expect(result.title).toBe('Test Game');
        });

        test('Should handle getDetails error', async () => {
            mockMakeRequest.mockRejectedValue(new Error('API Error'));

            await expect(rawgService.getDetails('1')).rejects.toThrow();
        });
    });

    describe('getGenres', () => {
        test('Should get genres successfully', async () => {
            const mockData = {
                results: [
                    { id: 1, name: 'Action' },
                    { id: 2, name: 'RPG' }
                ]
            };

            mockMakeRequest.mockResolvedValue(mockData);

            const result = await rawgService.getGenres();

            expect(result).toBeDefined();
            expect(result).toHaveLength(2);
        });

        test('Should handle getGenres error', async () => {
            mockMakeRequest.mockRejectedValue(new Error('API Error'));

            await expect(rawgService.getGenres()).rejects.toThrow();
        });
    });

    describe('getPlatforms', () => {
        test('Should get platforms successfully', async () => {
            const mockData = {
                results: [
                    { id: 1, name: 'PC' },
                    { id: 2, name: 'PlayStation' }
                ]
            };
            
            mockMakeRequest.mockResolvedValue(mockData);

            const result = await rawgService.getPlatforms();

            expect(result).toBeDefined();
            expect(result).toHaveLength(2);
        });

        test('Should handle getPlatforms error', async () => {
            mockMakeRequest.mockRejectedValue(new Error('API Error'));

            await expect(rawgService.getPlatforms()).rejects.toThrow();
        });
    });
});