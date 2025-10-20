import { Link } from "react-router-dom";
import PropTypes from 'prop-types';

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

    const column1 = slots.slice(0, 5);
    const column2 = slots.slice(5, 10);

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

                {/* 2×5 Grid Preview */}
                <div className="mb-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Column 1 (items 1-5) */}
                        <div className="space-y-3">
                            {column1.map((item, index) => (
                                <ListItemPreview
                                    key={index}
                                    item={item}
                                    rank={index + 1}
                                />
                            ))}
                        </div>

                        {/* Column 2 (items 6-10) */}
                        <div className="space-y-3">
                            {column2.map((item, index) => (
                                <ListItemPreview
                                    key={index + 5}
                                    item={item}
                                    rank={index + 6}
                                />
                            ))}
                        </div>
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

function ListItemPreview({ item, rank }) {
    if (!item) {
        return (
            <div className="flex items-start gap-3">
                <div className="w-[60px] h-[90px] bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0"></div>
                <div className="flex-1 pt-1">
                    <p className="text-xs text-gray-400 dark:text-gray-500">Empty slot</p>
                </div>
            </div>
        );
    }

    const year = item.cachedData?.releaseDate
        ? new Date(item.cachedData.releaseDate).getFullYear()
        : item.releaseDate
            ? new Date(item.releaseDate).getFullYear()
            : null;

    return (
        <div className="flex items-start gap-3">
            {/* Rank badge (optional) */}
            <div className="relative flex-shrink-0">
                {/* Poster */}
                {item.cachedData?.posterUrl ? (
                    <img
                        src={item.cachedData.posterUrl}
                        alt={item.title}
                        className="w-[60px] h-[90px] object-cover rounded"
                    />
                ) : (
                    <div className="w-[60px] h-[90px] bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center text-xs text-gray-500">
                        No image
                    </div>
                )}
                
                {/* Rank badge overlay */}
                <div className="absolute -top-1 -left-1 bg-black bg-opacity-70 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {rank}
                </div>
            </div>

            {/* Info (right side) */}
            <div className="flex-1 pt-1">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                    {item.title}
                </h4>
                {year && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {year}
                    </p>
                )}
            </div>
        </div>
    )
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
        externalId: PropTypes.string,
        title: PropTypes.string,
        cachedData: PropTypes.shape({
            posterUrl: PropTypes.string,
            releaseDate: PropTypes.string,
        }),
        releaseDate: PropTypes.string,
    }),
    rank: PropTypes.number.isRequired,
};

export default ListCard;