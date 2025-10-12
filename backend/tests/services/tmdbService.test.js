const TMDBService = require('../../src/services/external/tmdbService');

jest.mock('../../src/services/external/baseService');
jest.mock('../../src/utils/cache');

describe('TMDBService Tests', () => {
    let tmdbService;
    let mockMakeRequest;

    beforeEach(() => {
        jest.clearAllMocks();
        tmdbService = new TMDBService();

        tmdbService.config = {
            baseUrl: 'https://api.themoviedb.org/3',
            defaultLanguage: 'en-US',
            imageBaseUrl: 'https://image.tmdb.org/t/p/',
            imageSize: { poster: 'w500' },
            endpoints: {
                search: '/search/movie',
                details: '/movie',
                genres: '/genre/movie/list',
                popular: '/movie/popular'
            }
        };

        mockMakeRequest = jest.fn();
        tmdbService.makeRequest = mockMakeRequest;
    });

    const createMockMovie = (id = 1, title = 'Test Movie') => ({
        id,
        title,
        poster_path: '/test.jpg',
        release_date: '2023-01-01',
        vote_average: 7.5,
        overview: 'Test overview',
        genre_ids: [1, 2]
    });

    describe('Search', () => {
        test('Should search movies successfully', async () => {
            const mockMovie = createMockMovie();
            const mockData = {
                results: [mockMovie],
                total_pages: 1,
                total_results: 1
            };
            
            mockMakeRequest.mockResolvedValue(mockData);

            const result = await tmdbService.search('test');

            expect(result).toBeDefined();
            expect(result.results).toHaveLength(1);
            expect(result.results[0].title).toBe('Test Movie');
        });

        test('Should handle search error', async () => {
            mockMakeRequest.mockRejectedValue(new Error('API Error'));
            await expect(tmdbService.search('test')).rejects.toThrow();
        });

        test('Should handle empty search results', async () => {
            const mockData = {
                results: [],
                total_pages: 0,
                total_results: 0
            };
            
            mockMakeRequest.mockResolvedValue(mockData);

            const result = await tmdbService.search('nonexistent', { page: 1, limit: 20 });

            expect(result).toBeDefined();
            expect(result.results).toHaveLength(0);
            expect(result.totalResults).toBe(0);
        });

        test('Should handle validation error in response', async () => {
            const mockData = {
                status_code: 7,
                status_message: 'Invalid API Key'
            };
            
            mockMakeRequest.mockResolvedValue(mockData);

            await expect(tmdbService.search('test')).rejects.toThrow();
        })
    });

    describe('getDetails', () => {
        test('Should get movie details successfully', async () => {
            const mockMovie = createMockMovie();
            mockMakeRequest.mockResolvedValue(mockMovie);

            const result = await tmdbService.getDetails('1');

            expect(result.externalId).toBe('1');
            expect(result.title).toBe('Test Movie');
        });

        test('Should handle getDetails error', async () => {
            mockMakeRequest.mockRejectedValue(new Error('API Error'));
            await expect(tmdbService.getDetails('1')).rejects.toThrow();
        });
    });

    describe('getGenres', () => {
        test('Should get genres successfully', async () => {
            const mockData = {
                genres: [
                    { id: 1, name: 'Action' },
                    { id: 2, name: 'Comedy' }
                ]
            };
            
            mockMakeRequest.mockResolvedValue(mockData);

            const result = await tmdbService.getGenres();

            expect(result).toBeDefined();
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ id: 1, name: 'Action' });
        });

        test('Should handle getGenres error', async () => {
            mockMakeRequest.mockRejectedValue(new Error('API Error'));

            await expect(tmdbService.getGenres()).rejects.toThrow();
        });
    });

    describe('getPopular', () => {
        test('Should get popular movies successfully', async () => {
            const mockMovie = createMockMovie();
            const mockData = {
                results: [mockMovie],
                total_pages: 1,
                total_results: 1
            };
            
            mockMakeRequest.mockResolvedValue(mockData);

            const result = await tmdbService.getPopular({ page: 1 });

            expect(result).toBeDefined();
            expect(result.results).toHaveLength(1);
            expect(result.results[0].title).toBe('Test Movie');
        });

        test('Should handle getPopular error', async () => {
            mockMakeRequest.mockRejectedValue(new Error('API Error'));

            await expect(tmdbService.getPopular({ page: 1 })).rejects.toThrow();
        })
    })
})