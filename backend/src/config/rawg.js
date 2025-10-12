module.exports = {
    apiKey: process.env.RAWG_API_KEY,
    baseUrl: 'https://api.rawg.io/api',
    timeout: 10000,
    endpoints: {
        search: '/games',
        details: '/games',
        genres: '/genres',
        platforms: '/platforms'
    }
};