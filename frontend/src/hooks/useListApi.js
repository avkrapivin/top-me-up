import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
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
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: true,
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
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
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
        onSuccess: (data) => {
            const newList = data.data;
            queryClient.setQueryData(['lists', newList._id], data);
            
            queryClient.setQueryData(['lists', 'user'], (old) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: [newList, ...old.data]
                };
            });
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
        onSuccess: (data, variables) => {
            const updatedList = data.data;
            
            queryClient.setQueryData(['lists', variables.id], data);
            
            queryClient.setQueryData(['lists', 'user'], (old) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map(list => 
                        list._id === variables.id ? updatedList : list
                    )
                };
            });
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
            const updatedList = data.data;
            queryClient.setQueryData(['lists', updatedList._id], data);
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
            const updatedList = data.data;
            queryClient.setQueryData(['lists', updatedList._id], data);
        },
    });
};

// Reorder items in list mutation
export const useReorderListItems = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ listId, newOrder }) => {
            const response = await api.put(`/lists/${listId}/items/reorder`, { newOrder });
            return response.data;
        },
        onSuccess: (data) => {
            const updatedList = data.data;
            queryClient.setQueryData(['lists', updatedList._id], data);
        },
    });
};

// Generate share token
export const useGenerateShareToken = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => api.post(`/lists/${id}/share`).then(res => res.data),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: ['list', id, 'share'] });
        },
    });
};

// Fetch list by share token
export const useListByShareToken = (token) => {
    return useQuery({
        queryKey: ['list', 'share', token],
        queryFn: async () => {
            const response = await api.get(`/lists/share/${token}/data`);
            return response.data;
        },
        enabled: !!token,
        staleTime: 60000, // 1 minute
    });
};

// Get existing share token
export const useShareToken = (id, { enabled = true } = {}) => {
    return useQuery({
        queryKey: ['list', id, 'share'],
        queryFn: async () => {
            const response = await api.get(`/lists/${id}/share`);
            return response.data;
        },
        enabled: Boolean(id) && enabled, 
        staleTime: 60000, // 1 minute
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
};

// Reset share token mutation
export const useResetShareToken = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const response = await api.delete(`/lists/${id}/share`);
            return response.data;
        },
        onSuccess: (data, id) => {
            queryClient.invalidateQueries({ queryKey: ['list', id, 'share']});
        },
    });
};

// List comments query key
export const listCommentsKey = (listId) => ['list', listId, 'comments'];

// List comments query
export const useListComments = (listId, options = {}) => {
    const limit = options.limit ?? 20;

    return useInfiniteQuery({
        queryKey: listCommentsKey(listId),
        queryFn: async ({ pageParam = null }) => {
            const params = { limit };
            if (pageParam) {
                params.cursor = pageParam;
            }
            const response = await api.get(`/lists/${listId}/comments`, { params });
            return response.data;
        },
        getNextPageParam: (lastPage) => {
            if (lastPage?.pagination?.hasNext) {
                return lastPage.pagination.nextCursor;
            }
            return undefined;
        },
        enabled: Boolean(listId),
        initialPageParam: null,
        onError: options.onError,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
    });
};

// Create comment mutation
export const useCreateComment = (listId) => {
    return useMutation({
        mutationFn: async ({ content, parentCommentId = null }) => {
            const payload = parentCommentId ? { content, parentCommentId } : { content };
            const response = await api.post(`/lists/${listId}/comments`, payload);
            return response.data;
        },
    });
};

// Toggle list like mutation
export const useToggleListLike = () => {
    return useMutation({
        mutationFn: async ({ listId, like }) => {
            const method = like ? api.post : api.delete;
            const response = await method(`/lists/${listId}/like`);
            return response.data.data;
        },
    });
};

// Toggle comment like mutation
export const useToggleCommentLike = () => {
    return useMutation({
        mutationFn: async ({ commentId, like }) => {
            const method = like ? api.post : api.delete;
            const response = await method(`/comments/${commentId}/like`);
            return response.data.data;
        },
    });
};