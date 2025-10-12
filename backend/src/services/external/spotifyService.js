const BaseExternalService = require("./baseService");
const spotifyConfig = require("../../config/spotify");
const { validateSpotifyResponse } = require("../../utils/apiValidator");
const { AuthenticationError } = require("../../utils/errors");

class SpotifyService extends BaseExternalService {
    constructor() {
        super(spotifyConfig, "Spotify");
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const response = await this.client.post(
                this.config.authUrl,
                'grant_type=client_credentials',
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
                    }
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

            return this.accessToken;
        } catch (error) {
            throw new AuthenticationError('Spotify', 'Failed to get access token');
        }
    }

    async makeRequest(endpoint, params = {}, useCache = true) {
        const token = await this.getAccessToken();

        const requestConfig = {
            params,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        return super.makeRequest(endpoint, requestConfig, useCache);
    }

    async search(query, options = {}) {
        const { page = 1, limit = 20, year, genre, type = 'album' } = options;
        const offset = (page - 1) * limit;

        let searchQuery = query;
        if (year) searchQuery += ` year:${year}`;
        if (genre) searchQuery += ` genre:${genre}`;

        const data = await this.makeRequest(this.config.endpoints.search, {
            q: searchQuery,
            type,
            limit,
            offset,
            market: this.config.defaultMarket
        });

        const validatedData = validateSpotifyResponse(data);

        return {
            results: validatedData.albums?.items.map(item => this.formatAlbumItem(item)) || [],
            totalPages: Math.ceil(validatedData.albums?.total || 0 / limit),
            totalResults: validatedData.albums?.total || 0,
            page
        };
    }

    async getDetails(id) {
        const data = await this.makeRequest(`${this.config.endpoints.album}/${id}`, {
            market: this.config.defaultMarket
        });

        return this.formatAlbumDetails(data);
    }

    async getGenres() {
        const data = await this.makeRequest(this.config.endpoints.genres);
        return data.genres.map(name => ({ name }));
    }

    async getPopular(options = {}) {
        const { page = 1, limit = 20 } = options;
        const year = new Date().getFullYear();

        const data = await this.makeRequest(this.config.endpoints.search, {
            q: `year:${year}`,
            type: 'album',
            limit,
            offset: (page - 1) * limit,
            market: this.config.defaultMarket
        });

        const validatedData = validateSpotifyResponse(data);

        return {
            results: validatedData.albums?.items.map(item => this.formatAlbumItem(item)) || [],
            totalPages: Math.ceil(validatedData.albums?.total || 0 / limit),
            totalResults: validatedData.albums?.total || 0,
            page
        };
    }

    formatAlbumItem(item) {
        return {
            externalId: item.id,
            title: item.name,
            artist: item.artists[0]?.name || 'Unknown Artist',
            year: new Date(item.release_date).getFullYear(),
            posterUrl: item.images[0]?.url || null,
            genres: item.genres || [],
            category: 'music'
        };
    }

    formatAlbumDetails(item) {
        return {
            externalId: item.id,
            title: item.name,
            artist: item.artists[0]?.name || 'Unknown Artist',
            year: new Date(item.release_date).getFullYear(),
            posterUrl: item.images[0]?.url || null,
            genres: item.genres || [],
            category: 'music'
        };
    }
}

module.exports = SpotifyService;