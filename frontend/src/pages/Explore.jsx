import { useMemo, useState } from 'react';
import Layout from '../components/Layout/Layout';
import ListCard from '../components/Lists/ListCard';
import ListCardSkeleton from '../components/UI/ListCardSkeleton';
import NetworkError from '../components/UI/NetworkError';
import { usePublicLists, useToggleListLike } from '../hooks/useListApi';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useAuthApi';
import { useToast } from '../contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';

const CATEGORY_FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Movies', value: 'movies' },
    { label: 'Music', value: 'music' },
    { label: 'Games', value: 'games' }
];

const SORT_OPTIONS = [
    { label: 'Newest', value: 'createdAt' },
    { label: 'Most Liked', value: 'likesCount' },
    { label: 'Most Viewed', value: 'viewsCount' }
];

const PAGE_LIMIT = 12;

function Explore() {
    const [category, setCategory] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [page, setPage] = useState(1);
    const [selectedAuthor, setSelectedAuthor] = useState(null);
    const { user } = useAuth();
    const { data: userProfile } = useUserProfile(!!user);
    const { showInfo } = useToast();
    const queryClient = useQueryClient();
    const toggleLikeMutation = useToggleListLike();

    const queryParams = useMemo(() => {
        const params = { page, limit: PAGE_LIMIT, sortBy };
        if (category !== 'all') {
            params.category = category;
        }
        if (selectedAuthor?.id) {
            params.userId = selectedAuthor.id;
        }
        return params;
    }, [category, sortBy, page, selectedAuthor]);

    const { data, isLoading, isError, error, isFetching } = usePublicLists(queryParams);
    const lists = data?.data ?? [];
    const pagination = data?.pagination ?? { page: 1, pages: 1, total: 0 };

    const handleCategoryChange = (value) => {
        if (value === category) return;
        setCategory(value);
        setPage(1);
    };

    const handleSortChange = (value) => {
        if (value === sortBy) return;
        setSortBy(value);
        setPage(1);
    };

    // Author click handler
    const handleAuthorClick = (userId, displayName) => {
        setSelectedAuthor({ id: userId, name: displayName });
        setPage(1);
    };

    // "My Lists" filter handler
    const handleMyListsClick = () => {
        if (!userProfile?._id) return;

        const currentAuthorId = selectedAuthor?.id ? String(selectedAuthor.id) : null;
        const userId = String(userProfile._id);

        if (currentAuthorId === userId) {
            setSelectedAuthor(null);
        } else {
            setSelectedAuthor({ id: userProfile._id, name: userProfile.displayName || user?.displayName || 'You' });
        }
        setPage(1);
    };

    // Clear filter handler
    const handleClearFilter = () => {
        setSelectedAuthor(null);
        setPage(1);
    };

    const handlePageChange = (nextPage) => {
        if (nextPage < 1 || nextPage > pagination.pages || nextPage === page) return;
        setPage(nextPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLikeToggle = async (listId, currentLiked) => {
        if (!user) {
            showInfo('Login to like lists');
            throw new Error('Authentication required');
        }

        try {
            const result = await toggleLikeMutation.mutateAsync({
                listId,
                like: !currentLiked
            });

            queryClient.setQueryData(['lists', 'public', queryParams], (old) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map(list =>
                        list._id === listId
                            ? {
                                ...list,
                                likesCount: result.likesCount,
                                userHasLiked: result.userHasLiked
                            }
                            : list
                    )
                };
            });
        } catch (err) {
            throw err;
        }
    };

    return (
        <Layout>
            <div className="py-10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Explore Public Lists
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Browse the latest community lists, filter by category, and find inspiration.
                        </p>
                    </div>

                    {selectedAuthor && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Showing lists by <strong className="font-semibold">{selectedAuthor.name}</strong>
                            </span>
                            <button
                                onClick={handleClearFilter}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear filter
                            </button>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-wrap gap-2">
                                {CATEGORY_FILTERS.map(({ label, value }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => handleCategoryChange(value)}
                                        className={`px-4 py-2 rounded-lg border transition ${category === value
                                            ? 'bg-blue-500 text-white border-blue-500'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                                {user && (
                                    <button
                                        type="button"
                                        onClick={handleMyListsClick}
                                        className={`px-4 py-2 rounded-lg border transition ${selectedAuthor?.id && userProfile?._id && String(selectedAuthor.id) === String(userProfile._id)
                                                ? 'bg-blue-500 text-white border-blue-500'
                                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        My Lists
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {SORT_OPTIONS.map(({ label, value }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => handleSortChange(value)}
                                        className={`px-4 py-2 rounded-lg border transition ${sortBy === value
                                            ? 'bg-blue-500 text-white border-blue-500'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            {Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                                <ListCardSkeleton key={`skeleton-${index}`} />
                            ))}
                        </div>
                    ) : isError ? (
                        <NetworkError
                            error={error}
                            onRetry={() => {
                                queryClient.invalidateQueries(['lists', 'public', queryParams]);
                            }}
                            title="Failed to Load Lists"
                        />
                    ) : (
                        <>
                            {lists.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center text-gray-600 dark:text-gray-300">
                                    No lists found for the selected filters.
                                </div>
                            ) : (
                                <div className="masonry-grid mb-6">
                                    {lists.map((list, index) => {
                                        const delayClass = `fade-in-up-delay-${Math.min(index, 11)}`;
                                        return (
                                            <div
                                                key={list._id}
                                                className={`masonry-item fade-in-up ${delayClass}`}
                                            >
                                                <ListCard
                                                    list={list}
                                                    linkTo={list.shareToken ? `/share/${list.shareToken}` : `/list/${list._id}`}
                                                    onLikeToggle={(nextLiked) => handleLikeToggle(list._id, list.userHasLiked)}
                                                    isLiked={list.userHasLiked ?? false}
                                                    isLikePending={toggleLikeMutation.isPending}
                                                    onAuthorClick={handleAuthorClick}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-gray-600 dark:text-gray-300">
                                    Page {pagination.page} / {pagination.pages}{' '}
                                    <span className="text-gray-500 dark:text-gray-400">
                                        ({pagination.total} total lists)
                                    </span>
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page <= 1 || isFetching}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.pages || isFetching}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default Explore;