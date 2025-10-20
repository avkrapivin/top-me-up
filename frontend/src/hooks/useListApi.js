import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

// Fetch user's lists
export const useUserLists = (params = {}) => {
    return useQuery({
        queryKey: ['lists', 'user', params],
        queryFn: async () => {
            const response = await api.get('/lists', { params });
            return response.data;
        },
        staleTime: 30000, // 30 seconds
    });
};

// Fetch public lists
export const usePublicLists = (params = {}) => {
    return useQuery({
        queryKey: ['lists', 'public', params],
        queryFn: async () => {
            const response = await api.get('/lists/public', { params });
            return response.data;
        },
        staleTime: 60000, // 1 minute
    });
};

// Fetch single list by ID
export const useList = (id) => {
    return useQuery({
        queryKey: ['lists', id],
        queryFn: async () => {
            const response = await api.get(`/lists/${id}`);
            return response.data;
        },
        enabled: !!id,
        staleTime: 30000, // 30 seconds
    });
};

// Create list mutation
export const useCreateList = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post('/lists', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lists'] });
        },
    });
};

// Update list mutation
export const useUpdateList = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await api.put(`/lists/${id}`, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['lists'] });
            queryClient.invalidateQueries({ queryKey: ['lists', data.data._id] });
        },
    });
};

// Delete list mutation
export const useDeleteList = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const response = await api.delete(`/lists/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lists'] });
        },
    });
};

// Add item to list mutation
export const useAddListItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ listId, itemData }) => {
            const response = await api.post(`/lists/${listId}/items`, itemData);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['lists'] });
            queryClient.invalidateQueries({ queryKey: ['lists', data.data._id] });
        },
    });
};

// Update item in list mutation
export const useUpdateListItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ listId, itemId, data }) => {
            const response = await api.put(`/lists/${listId}/items/${itemId}`, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['lists', data.data._id] });
        },
    });
};

// Remove item from list mutation
export const useRemoveListItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ listId, itemId }) => {
            const response = await api.delete(`/lists/${listId}/items/${itemId}`);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['lists', data.data._id] });
        },
    });
};

// Reorder items in list mutation
export const useReorderListItems = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ listId, items }) => {
            const response = await api.put(`/lists/${listId}/items/reorder`, { items });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['lists', data.data._id] });
        },
    });
};