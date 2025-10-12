import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

// Health check hook
export const useHealthCheck = () => {
    return useQuery({
        queryKey: ['health'],
        queryFn: async () => {
            const response = await api.get('/health');
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

// Generic API hook
export const useApiQuery = (queryKey, endpoint, options = {}) => {
    return useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            const response = await api.get(endpoint);
            return response.data;
        },
        ...options,
    });
};

export const useApiMutation = (endpoint, options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post(endpoint, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries();
        },
        ...options,
    });
};