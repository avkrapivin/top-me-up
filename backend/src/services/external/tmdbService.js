const BaseExternalService = require('./baseService');
const tmdbConfig = require('../../config/tmdb');
const { validateTMDBResponse } = require('../../utils/apiValidator');

class TMDBService extends BaseExternalService {
    constructor() {
        super(tmdbConfig, 'TMDB');
    }

    async search(query, options = {}) {
        const { page = 1, year, genre, sortBy = 'popularity.desc' } = options;
        
        const params = {
            query,
            page,
            include_adult: false,
            language: this.config.defaultLanguage,
            sort_by: sortBy
        };

        if (year) params.year = year;
        if (genre) params.with_genres = genre;

        const data = await this.makeRequest(this.config.endpoints.search, params);
        const validatedData = validateTMDBResponse(data);

        return {
            results: validatedData.results.map(item => this.formatMovieItem(item)),
            totalPages: validatedData.total_pages,
            totalResults: validatedData.total_results,
            page: validatedData.page
        };
    }

    async getDetails(id) {
        const data = await this.makeRequest(`${this.config.endpoints.details}/${id}`, {
            language: this.config.defaultLanguage,
            append_to_response: 'credits,videos,images,reviews'
        });

        return this.formatMovieDetails(data);
    }

    async getGenres() {
        const data = await this.makeRequest(this.config.endpoints.genres, {
            language: this.config.defaultLanguage
        });

        return data.genres.map(genre => ({
            id: genre.id,
            name: genre.name
        }));
    }

    async getPopular(options = {}) {
        const { page = 1, year } = options;
        const params = {
            page,
            language: this.config.defaultLanguage
        };

        if (year) {
            params.primary_release_year = year;
        }

        const data = await this.makeRequest(this.config.endpoints.popular, params);
        const validatedData = validateTMDBResponse(data);

        return {
            results: validatedData.results.map(item => this.formatMovieItem(item)),
            totalPages: validatedData.total_pages,
            totalResults: validatedData.total_results
        };
    }

    formatMovieItem(item) {
        return {
            externalId: item.id.toString(),
            title: item.title,
            year: item.release_date ? new Date(item.release_date).getFullYear() : null,
            posterUrl: item.poster_path ? `${this.config.imageBaseUrl}/${this.config.imageSize.poster}${item.poster_path}` : null,
            rating: item.vote_average,
            genres: item.genre_ids?.map(id => id.toString()) || [],
            category: 'movies'
        };
    }

    formatMovieDetails(item) {
        return {
            externalId: item.id.toString(),
            title: item.title,
            year: item.release_date ? new Date(item.release_date).getFullYear() : null,
            posterUrl: item.poster_path ? `${this.config.imageBaseUrl}/${this.config.imageSize.poster}${item.poster_path}` : null,
            rating: item.vote_average,
            genres: item.genres?.map(g => g.name) || [],
            imdbId: item.imdb_id,
            category: 'movies'
        };
    }
}

module.exports = TMDBService;