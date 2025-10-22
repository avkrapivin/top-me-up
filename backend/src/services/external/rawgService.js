const BaseExternalService = require("./baseService");
const rawgConfig = require("../../config/rawg");
const { validateRAWGResponse } = require("../../utils/apiValidator");

class RAWGService extends BaseExternalService {
    constructor() {
        super(rawgConfig, "RAWG");
    }

    async search(query, options = {}) {
        const { page = 1, pageSize = 20, year, genre, platform, ordering = '-rating' } = options;

        const params = {
            search: query,
            page,
            page_size: pageSize,
            ordering
        };

        if (year) params.dates = `${year}-01-01,${year}-12-31`;
        if (genre) params.genres = genre;
        if (platform) params.platform = platform;

        const data = await this.makeRequest(this.config.endpoints.search, params);
        const validatedData = validateRAWGResponse(data);

        return {
            results: validatedData.results.map(item => this.formatGameItem(item)),
            totalPages: Math.ceil(validatedData.count / pageSize),
            totalResults: validatedData.count,
            page
        };
    }

    async getDetails(id) {
        const data = await this.makeRequest(`${this.config.endpoints.details}/${id}`);
        return this.formatGameDetails(data);
    }

    async getGenres() {
        const data = await this.makeRequest(this.config.endpoints.genres);
        return data.results.map(item => ({ id: item.id, name: item.name }));
    }

    async getPlatforms() {
        const data = await this.makeRequest(this.config.endpoints.platforms);
        return data.results.map(item => ({ id: item.id, name: item.name }));
    }

    async getPopular(options = {}) {
        const { page = 1, pageSize = 20 } = options;
        const year = new Date().getFullYear();

        const params = {
            page,
            page_size: pageSize,
            ordering: '-rating',
            dates: `${year - 1}-01-01,${year}-12-31`,
            metacritic: '85,100'
        };

        const data = await this.makeRequest(this.config.endpoints.search, params);
        const validatedData = validateRAWGResponse(data);

        return {
            results: validatedData.results.map(item => this.formatGameItem(item)),
            totalPages: Math.ceil(validatedData.count / pageSize),
            totalResults: validatedData.count,
            page
        };
    }

    formatGameItem(item) {
        return {
            externalId: item.id.toString(),
            title: item.name,
            year: new Date(item.released).getFullYear(),
            posterUrl: item.background_image || null,
            rating: item.rating,
            genres: item.genres?.map(g => g.name) || [],
            category: 'games'
        };
    }

    formatGameDetails(item) {
        return {
            externalId: item.id.toString(),
            title: item.name,
            year: new Date(item.released).getFullYear(),
            posterUrl: item.background_image || null,
            rating: item.rating,
            genres: item.genres?.map(g => g.name) || [],
            category: 'games'
        };
    }
}

module.exports = RAWGService;