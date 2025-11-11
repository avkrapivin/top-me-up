import { useMemo, useState } from 'react';
import Layout from '../components/Layout/Layout';
import ListCard from '../components/Lists/ListCard';
import { usePublicLists } from '../hooks/useListApi';

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

    const queryParams = useMemo(() => {
        const params = { page, limit: PAGE_LIMIT, sortBy };
        if (category !== 'all') {
            params.category = category;
        }
        return params;
    }, [category, sortBy, page]);

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

    const handlePageChange = (nextPage) => {
        if (nextPage < 1 || nextPage > pagination.pages || nextPage === page) return;
        setPage(nextPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-wrap gap-2">
                                {CATEGORY_FILTERS.map(({ label, value }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => handleCategoryChange(value)}
                                        className={`px-4 py-2 rounded-lg border transition ${
                                            category === value
                                                ? 'bg-blue-500 text-white border-blue-500'
                                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {SORT_OPTIONS.map(({ label, value }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => handleSortChange(value)}
                                        className={`px-4 py-2 rounded-lg border transition ${
                                            sortBy === value
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
                        <div className="min-h-[40vh] flex items-center justify-center">
                            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
                        </div>
                    ) : isError ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <p className="text-red-600 dark:text-red-400">
                                Failed to load lists: {error?.message || 'Unknown error'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {lists.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center text-gray-600 dark:text-gray-300">
                                    No lists found for the selected filters.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                    {lists.map((list) => (
                                        <ListCard
                                            key={list._id}
                                            list={list}
                                            linkTo={
                                                list.shareToken
                                                    ? `/share/${list.shareToken}`
                                                    : `/list/${list._id}`
                                            } 
                                        />
                                    ))}
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