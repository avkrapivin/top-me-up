module.exports = {
    apiKey: process.env.TMDB_API_KEY,
    baseUrl: 'https://api.themoviedb.org/3',
    timeout: 10000,
    defaultLanguage: 'en-US',
    imageBaseUrl: 'https://image.tmdb.org/t/p/',
    imageSize: {
        poster: 'w500',
        backdrop: 'w1280',
        profile: 'w185'
    },
    endpoints: {
        search: '/search/movie',
        details: '/movie',
        genres: '/genre/movie/list',
        popular: '/movie/popular',
        topRated: '/movie/top_rated'
    }
};