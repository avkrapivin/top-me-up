import { Link } from "react-router-dom";
import PropTypes from 'prop-types';

const posterConfigByCategory = {
    movies: { width: 64, height: 96, imageClass: 'object-cover', containerBg: 'bg-gray-200 dark:bg-gray-700' },
    music: { width: 64, height: 64, imageClass: 'object-cover', containerBg: 'bg-gray-200 dark:bg-gray-700' },
    games: { width: 96, height: null, aspectRatio: '16 / 9', imageClass: 'object-cover', containerBg: 'bg-gray-200 dark:bg-gray-700' },
};

const getPosterConfig = (category) => posterConfigByCategory[category] || posterConfigByCategory.movies;

function ListCard({ list, onDelete, showActions = false }) {
    const getCategoryLabel = (category) => {
        switch (category) {
            case 'movies':
                return 'Movies';
            case 'music':
                return 'Music';
            case 'games':
                return 'Games';
            default:
                return 'List';
        }
    };

    const handleDelete = (e) => {
        e.preventDefault();
        if (window.confirm(`Are you sure you want to delete "${list.title}"?`)) {
            onDelete(list._id);
        }
    };

    const slots = Array(10).fill(null).map((_, index) => {
        return list.items?.[index] || null;
    });

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <Link to={`/builder/${list._id}`} className="block p-6">
                {/* Header */}
                <div className="mb-4">
                    <div className="mb-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {getCategoryLabel(list.category)}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {list.title}
                    </h3>
                    {list.description && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                            {list.description}
                        </p>
                    )}
                </div>

                <div className="mb-4">
                    <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
                        {Array.from({ length: 10 }).map((_, index) => {
                            const item = slots[index];
                            return item ? (
                                <ListItemPreview key={item._id || item.externalId} item={item} />
                            ) : (
                                <EmptySlot key={`empty-${index}`} category={list.category} />
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                        <span>{list.items?.length || 0}/10 items</span>
                        <span className={list.isPublic ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                            {list.isPublic ? 'Public' : 'Private'}
                        </span>
                    </div>
                    {list.likesCount > 0 && (
                        <span>{list.likesCount} likes</span>
                    )}
                </div>
            </Link>

            {/* Actions */}
            {showActions && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-end gap-2">
                    <Link
                        to={`/builder/${list._id}`}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                    >
                        Edit
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}

function ListItemPreview({ item }) {
    const year = item.cachedData?.year || null;
    const config = getPosterConfig(item.category);

    return (
        <div className="flex flex-col items-center text-center">
            <div
                style={{
                    width: `${config.width}px`,
                    height: config.height ? `${config.height}px` : 'auto',
                    aspectRatio: config.aspectRatio || undefined,
                }}
                className={`rounded shadow-md overflow-hidden flex items-center justify-center ${config.containerBg}`}
            >
                <img
                    src={item.cachedData?.posterUrl || '/placeholder.png'}
                    alt={item.title}
                    className={`${config.imageClass} w-full h-full`}
                />
            </div>
            <p className="text-xs text-gray-800 dark:text-gray-200 mt-1 line-clamp-2 leading-tight overflow-hidden text-ellipsis">
                {item.title}
            </p>
            {item.category === 'music' && (item.cachedData?.artist || item.artist) && (
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                    {item.cachedData?.artist || item.artist}
                </p>
            )}
            {year && (
                <p className="text-xs text-gray-600 dark:text-gray-400">({year})</p>
            )}
        </div>
    )
}

function EmptySlot({ category = 'movies' }) {
    const config = getPosterConfig(category);

    return (
        <div className="flex flex-col items-center text-center">
            <div
                style={{
                    width: `${config.width}px`,
                    height: config.height ? `${config.height}px` : 'auto',
                    aspectRatio: config.aspectRatio || undefined, 
                }}
                className={`rounded shadow-md flex items-center justify-center ${config.containerBg}`}
            />
        </div>
    );
}

ListCard.propTypes = {
    list: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        category: PropTypes.oneOf(['movies', 'music', 'games']).isRequired,
        description: PropTypes.string,
        items: PropTypes.array,
        isPublic: PropTypes.bool,
        likesCount: PropTypes.number,
    }).isRequired,
    onDelete: PropTypes.func,
    showActions: PropTypes.bool,
};

ListItemPreview.propTypes = {
    item: PropTypes.shape({
        _id: PropTypes.string,
        externalId: PropTypes.string,
        title: PropTypes.string,
        category: PropTypes.oneOf(['movies', 'music', 'games']).isRequired,
        cachedData: PropTypes.shape({
            posterUrl: PropTypes.string,
            year: PropTypes.number,
            artist: PropTypes.string,
        }),
    }),
};

EmptySlot.propTypes = {
    category: PropTypes.oneOf(['movies', 'music', 'games']),
};

export default ListCard;