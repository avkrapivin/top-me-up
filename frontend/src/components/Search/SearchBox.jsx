import { useState, useEffect, useCallback, startTransition } from "react";
import { useSearchContent } from "../../hooks/useSearchApi";
import PropTypes from 'prop-types';

const useDebouncedValue = (value, delay = 400) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

function SearchBox({ category, onSelectItem, placeholder = 'Search...' }) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const debouncedQuery = useDebouncedValue(query, 450);

    const { data, isLoading, error } = useSearchContent(
        category,
        debouncedQuery,
        { limit: 10 },
        {
            enabled: debouncedQuery.length >= 2,
            staleTime: 60 * 1000,
            keepPreviousData: true,
            refetchOnWindowFocus: false,
            retry: 0,
        }
    );

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        startTransition(() => {
            setIsOpen(value.trim().length >= 2);
        });
    };

    const handleSelectItem = useCallback((item) => {
        onSelectItem(item);
        setQuery('');
        setIsOpen(false);
    }, [onSelectItem]);

    const handleClickOutside = useCallback((e) => {
        if (!e.target.closest('.search-box-container')) {
            setIsOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [handleClickOutside]);

    return (
        <div className="search-box-container relative w-full">
            {/* Search Input */}
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-96 overflow-y-auto">
                    {error && (
                        <div className="p-4 text-red-600 dark:text-red-400">
                            Error: {error.message}
                        </div>
                    )}

                    {!isLoading && !error && data?.data?.results?.length === 0 && (
                        <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
                            No results found
                        </div>
                    )}

                    <div className="max-h-64 overflow-y-auto">
                        {data?.data?.results?.slice(0, 10).map((item) => (
                            <button
                                key={item.externalId}
                                onClick={() => handleSelectItem(item)}
                                className="w-full p-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-left transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                            >
                                {/* Poster/Image */}
                                {item.posterUrl ? (
                                    <img
                                        src={item.posterUrl}
                                        alt={item.title}
                                        className="w-12 h-16 object-cover rounded flex-shrink-0"
                                        style={category === 'music' ? { width: '48px', height: '48px' } : { width: '48px', height: '72px' }}
                                        loading="lazy"
                                    />
                                ) : (
                                    <div
                                        className="bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center text-gray-400 text-xs flex-shrink-0"
                                        style={category === 'music' ? { width: '48px', height: '48px' } : { width: '48px', height: '72px' }}
                                    >
                                        No image
                                    </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                        {item.title}
                                    </h4>
                                    {item.year && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {item.year}
                                        </p>
                                    )}
                                    {item.artist && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {item.artist}
                                        </p>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

SearchBox.propTypes = {
    category: PropTypes.oneOf(['movies', 'music', 'games']).isRequired,
    onSelectItem: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
};

export default SearchBox;