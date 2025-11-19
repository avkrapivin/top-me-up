import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import api from '../services/api';
import { auth } from '../config/firebase';
import { useAuthStore } from '../store/authStore';

// Get user profile
export const useUserProfile = (enabled = true) => {
    return useQuery({
        queryKey: ['user', 'profile'],
        queryFn: async () => {
            const { data } = await api.get('/auth/profile');
            return data.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        enabled,
    });
};

// Update user profile
export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    const updateDisplayName = useAuthStore.getState().updateDisplayName;

    return useMutation({
        mutationFn: async ({ displayName, ...rest }) => {
            const trimmedName = displayName?.trim();

            if (trimmedName && auth.currentUser) {
                await updateFirebaseProfile(auth.currentUser, { displayName: trimmedName });
            }

            const { data } = await api.put('/auth/profile', {
                ...rest,
                displayName: trimmedName,
            });

            return data.data;
        },
        onSuccess: (updatedUser) => {
            if (updatedUser?.displayName) {
                updateDisplayName(updatedUser.displayName);
            }
            queryClient.setQueryData(['user', 'profile'], updatedUser);
            queryClient.invalidateQueries({ queryKey: ['lists', 'user'] });
        },
    });
};

export const useUpdatePassword = () => {
    return useMutation({
        mutationFn: async ({ currentPassword, newPassword }) => {
            const user = auth.currentUser;

            if (!user?.email) {
                throw new Error('User is not authenticated');
            }

            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
        }
    })
}