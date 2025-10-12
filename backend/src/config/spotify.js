module.exports = {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    baseUrl: 'https://api.spotify.com/v1',
    authUrl: 'https://accounts.spotify.com/token',
    timeout: 10000,
    defaultLanguage: 'en-US',
    endpoints: {
        search: '/search',
        album: '/albums',
        genres: '/recommendations/available-genre-seeds'
    }
};