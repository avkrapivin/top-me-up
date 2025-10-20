import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

// Search content
export const useSearchContent = (category, query, params = {}, options = {}) => {
    return useQuery({
        queryKey: ['search', category, query, params],
        queryFn: async () => {
            const response = await api.get(`/search/${category}`, { 
                params: { q: query, ...params }
            });
            return response.data;
        },
        enabled: !!query && query.length >= 2, // Only search if query is valid
        staleTime: 300000, // 5 minutes
        ...options,
    });
};

// Get genres for category
export const useGenres = (category) => {
    return useQuery({
        queryKey: ['genres', category],
        queryFn: async () => {
            const response = await api.get(`/search/${category}/genres`);
            return response.data;
        },
        enabled: !!category,
        staleTime: 3600000, // 1 hour
    });
};

// Get platforms (games only)
export const usePlatforms = () => {
    return useQuery({
        queryKey: ['platforms'],
        queryFn: async () => {
            const response = await api.get('/search/games/platforms');
            return response.data;
        },
        staleTime: 3600000, // 1 hour
    });
};

// Get popular content
export const usePopularContent = (category, params = {}) => {
    return useQuery({
        queryKey: ['popular', category, params],
        queryFn: async () => {
            const response = await api.get(`/search/${category}/popular`, { params });
            return response.data;
        },
        enabled: !!category,
        staleTime: 300000, // 5 minutes
    });
};