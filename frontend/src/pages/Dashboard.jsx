import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUserLists } from '../hooks/useListApi';
import ListCard from '../components/Lists/ListCard';
import Layout from '../components/Layout/Layout';
import EmptyState from '../components/UI/EmptyState';
import { useQueryClient } from '@tanstack/react-query';
import NetworkError from '../components/UI/NetworkError';

const DashboardEmptyIcon = () => (
    <svg
        className="w-24 h-24 text-gray-400 dark:text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
        <circle
            cx="18"
            cy="6"
            r="3"
            fill="currentColor"
            opacity="0.2"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 4v4M16 6h4"
        />
    </svg>
);

function Dashboard() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: listsData, isLoading, isError, error } = useUserLists();

    const handleRetry = () => {
        queryClient.invalidateQueries({ queryKey: ['lists', 'user'] });
    };

    return (
        <Layout>
            <div className="py-10">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Dashboard
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300">
                                Welcome, {user?.displayName || 'User'}!
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {user?.email}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Your Lists
                                </h2>
                                <button
                                    onClick={() => navigate('/builder')}
                                    className="bg-blue-500 hover:bg-blue-600 !text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                                >
                                    Create New List
                                </button>
                            </div>

                            {isLoading && (
                                <p className="text-gray-600 dark:text-gray-300">Loading your lists...</p>
                            )}

                            {isError && (
                                <NetworkError
                                    error={error}
                                    onRetry={handleRetry}
                                    title="Failed to Load Your Lists"
                                    className="mt-4"
                                />
                            )}

                            {!isLoading && !error && listsData?.data?.length === 0 && (
                                <EmptyState
                                    icon={<DashboardEmptyIcon />}
                                    title="No lists yet"
                                    message="Create your first list to get started! Build your top 10 lists of movies, music, or games."
                                    actionLabel="Create New List"
                                    onAction={() => navigate('/builder')}
                                />
                            )}

                            {!isLoading && !error && listsData?.data?.length > 0 && (
                                <div className="masonry-grid">
                                    {listsData.data.map((list, index) => {
                                        const delayClass = `fade-in-up-delay-${Math.min(index, 11)}`;
                                        return (
                                            <div
                                                key={list._id}
                                                className={`masonry-item fade-in-up ${delayClass}`}
                                            >
                                                <ListCard list={list} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default Dashboard;