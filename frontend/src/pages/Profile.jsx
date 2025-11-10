import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile, useUpdateProfile, useUpdatePassword } from '../hooks/useAuthApi';
import { useToast } from '../contexts/ToastContext';
import Layout from '../components/Layout/Layout';

function Profile() {
    const { user: authUser } = useAuth();
    const { data: profile, isLoading } = useUserProfile(!!authUser);
    const updateProfileMutation = useUpdateProfile();
    const updatePasswordMutation = useUpdatePassword();
    const { showSuccess, showError } = useToast();

    const [displayName, setDisplayName] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');

    const isPasswordDirty = useMemo(
        () =>
            passwordForm.currentPassword.trim().length > 0 ||
            passwordForm.newPassword.trim().length > 0 ||
            passwordForm.confirmPassword.trim().length > 0,
        [passwordForm]
    );

    useEffect(() => {
        const resolvedName = profile?.displayName ?? authUser?.displayName ?? '';
        setDisplayName(resolvedName);
        setIsDirty(false);
    }, [profile, authUser]);

    const originalDisplayName = useMemo(
        () => profile?.displayName ?? authUser?.displayName ?? '',
        [profile, authUser]
    );

    const handleSave = async () => {
        const trimmed = displayName.trim();

        if (!trimmed) {
            showError('Name cannot be empty');
            return;
        }

        if (trimmed.length > 100) {
            showError('Name must be 100 characters or less');
            return;
        }

        try {
            await updateProfileMutation.mutateAsync({ displayName: trimmed });
            showSuccess('Profile updated successfully');
            setIsDirty(false);
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to update profile';
            showError(message);
        }
    };

    const handleCancel = () => {
        setDisplayName(originalDisplayName);
        setIsDirty(false);
    };

    const handlePasswordFieldChange = (field) => (event) => {
        setPasswordError('');
        setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const resetPasswordForm = () => {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordError('');
    };

    const handlePasswordSave = async () => {
        const { currentPassword, newPassword, confirmPassword } = passwordForm;

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError('All password fields are required');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        try {
            await updatePasswordMutation.mutateAsync({ currentPassword, newPassword });
            showSuccess('Password updated successfully');
            resetPasswordForm();
        } catch (error) {
            const isWrongPassword =
                error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential';

            const message = isWrongPassword
                ? 'Current password is incorrect'
                : error.message || 'Failed to update password';

            setPasswordError(message);
            showError(message);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            </Layout>
        );
    }

    const stats = profile?.stats || {
        listsCreated: 0,
        totalLikes: 0,
        totalViews: 0
    };

    return (
        <Layout>
            <div className="py-10">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Profile Settings
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Manage your account information
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                            Account Information
                        </h2>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Name
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => {
                                        const nextValue = e.target.value;
                                        setDisplayName(nextValue);
                                        setIsDirty(nextValue.trim() !== originalDisplayName.trim());
                                    }}
                                    maxLength={100}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your display name"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={!isDirty || updateProfileMutation.isPending}
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {updateProfileMutation.isPending ? 'Saving…' : 'Save'}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={!isDirty || updateProfileMutation.isPending}
                                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {displayName.length}/100 characters
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={authUser?.email || ''}
                                disabled
                                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Email cannot be changed
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                            Password
                        </h2>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={handlePasswordFieldChange('currentPassword')}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter current password"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={handlePasswordFieldChange('newPassword')}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Minimum 6 characters"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={handlePasswordFieldChange('confirmPassword')}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Repeat new password"
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                                    <button
                                        onClick={handlePasswordSave}
                                        disabled={!isPasswordDirty || updatePasswordMutation.isPending}
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {updatePasswordMutation.isPending ? 'Saving…' : 'Save'}
                                    </button>
                                    <button
                                        onClick={resetPasswordForm}
                                        disabled={!isPasswordDirty || updatePasswordMutation.isPending}
                                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                            {passwordError && (
                                <p className="text-sm text-red-500 dark:text-red-400">
                                    {passwordError}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                            Statistics
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                    {stats.listsCreated}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Lists Created
                                </div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                                    {stats.totalLikes}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Likes Received
                                </div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                                    {stats.totalViews}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Views Received
                                </div>
                            </div>
                        </div>
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                            Member since: {formatDate(profile?.createdAt)}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default Profile;