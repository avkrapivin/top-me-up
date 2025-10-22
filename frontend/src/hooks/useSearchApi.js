import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

// Search content
export const useSearchContent = (category, query, params = {}, options = {}) => {
    return useQuery({
        queryKey: ['search', category, query, params],
        enabled: !!query && query.length >= 2,
        queryFn: async ({ signal }) => {
            const response = await api.get(`/search/${category}`, {
                params: { q: query, ...params },
                signal,
            });
            return response.data;
        },
        staleTime: options.staleTime ?? 60_000,
        keepPreviousData: options.keepPreviousData ?? true,
        refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
        retry: options.retry ?? 0,
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