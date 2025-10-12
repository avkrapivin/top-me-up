const SpotifyService = require('../../src/services/external/spotifyService');

jest.mock('../../src/services/external/baseService');
jest.mock('../../src/utils/cache');

describe('SpotifyService Tests', () => {
    let spotifyService;
    let mockMakeRequest;
    let mockGetAccessToken;
    
    beforeEach(() => {
        jest.clearAllMocks();
        spotifyService = new SpotifyService();

        spotifyService.config = {
            baseUrl: 'https://api.spotify.com/v1',
            authUrl: 'https://accounts.spotify.com/api/token',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            defaultMarket: 'US',
            endpoints: {
                search: '/search',
                album: '/albums',
                genres: '/recommendations/available-genre-seeds'
            }
        };

        mockMakeRequest = jest.fn();
        mockGetAccessToken = jest.fn().mockResolvedValue('token');

        spotifyService.makeRequest = mockMakeRequest;
        spotifyService.getAccessToken = mockGetAccessToken;
    });

    const createMockAlbum = (id = '1', name = 'Test Album') => ({
        id,
        name,
        artists: [{ name: 'Test Artist' }],
        images: [{ url: 'test.jpg'}],
        release_date: '2023-01-01'
    });

    describe('search', () => {
        test('Should search albums successfully', async () => {
            const mockAlbum = createMockAlbum();
            const mockData = {
                albums: {
                    items: [mockAlbum],
                    total: 1
                }
            };

            mockMakeRequest.mockResolvedValue(mockData);

            const result = await spotifyService.search('test', { page: 1, limit: 20 });

            expect(result).toBeDefined();
            expect(result.results).toHaveLength(1);
            expect(result.results[0].title).toBe('Test Album');
        });

        test('Should handle search error', async () => {
            mockMakeRequest.mockRejectedValue(new Error('API Error'));

            await expect(spotifyService.search('test', { page: 1, limit: 20 })).rejects.toThrow();
        });

        test('Should handle empty search results', async () => {
            const mockData = {
                albums: {
                    items: [],
                    total: 0
                }
            };

            mockMakeRequest.mockResolvedValue(mockData);

            const result = await spotifyService.search('nonexistent', { page: 1, limit: 20 });

            expect(result).toBeDefined();
            expect(result.results).toHaveLength(0);
            expect(result.totalResults).toBe(0);
        });
    });

    describe('getDetails', () => {
        test('Should get album details successfully', async () => {
            const mockAlbum = createMockAlbum();
            mockMakeRequest.mockResolvedValue(mockAlbum);

            const result = await spotifyService.getDetails('1');

            expect(result).toBeDefined();
            expect(result.title).toBe('Test Album');
        });

        test('Should handle getDetails error', async () => {
            mockMakeRequest.mockRejectedValue(new Error('API Error'));

            await expect(spotifyService.getDetails('1')).rejects.toThrow();
        })
    });

    describe('getGenres', () => {
        test('Should get genres successfully', async () => {
            const mockData = {
                genres: ['rock', 'pop', 'jazz']
            };
            
            mockMakeRequest.mockResolvedValue(mockData);

            const result = await spotifyService.getGenres();

            expect(result).toBeDefined();
            expect(result).toHaveLength(3);
        });

        test('Should handle getGenres error', async () => {
            mockMakeRequest.mockRejectedValue(new Error('API Error'));

            await expect(spotifyService.getGenres()).rejects.toThrow();
        });
    });
});