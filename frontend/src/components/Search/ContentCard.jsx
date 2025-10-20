import PropTypes from 'prop-types';

function ContentCard({ item, onAdd, onRemove, isAdded = false, rank = null }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
            {/* Image */}
            <div className="relative">
                {item.posterUrl || item.cachedData?.posterUrl ? (
                    <img
                        src={item.posterUrl || item.cachedData?.posterUrl}
                        alt={item.title}
                        className="w-full h-64 object-cover"
                    />
                ) : (
                    <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                        No image available
                    </div>
                )}
                
                {/* Rank badge */}
                {rank !== null && (
                    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-lg font-bold rounded-full w-10 h-10 flex items-center justify-center">
                        {rank}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {item.title}
                </h3>

                {/* Metadata */}
                <div className="space-y-1 mb-4">
                    {item.releaseDate && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(item.releaseDate).getFullYear()}
                        </p>
                    )}
                    {item.artist && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.artist}
                        </p>
                    )}
                    {item.genres && item.genres.length > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.genres.slice(0, 2).join(', ')}
                        </p>
                    )}
                </div>

                {/* Actions */}
                {onAdd && !isAdded && (
                    <button
                        onClick={() => onAdd(item)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                    >
                        Add to List
                    </button>
                )}

                {onRemove && isAdded && (
                    <button
                        onClick={() => onRemove(item)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                    >
                        Remove from List
                    </button>
                )}
            </div>
        </div>
    );
}

ContentCard.propTypes = {
    item: PropTypes.shape({
        externalId: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        posterUrl: PropTypes.string,
        releaseDate: PropTypes.string,
        artist: PropTypes.string,
        genres: PropTypes.arrayOf(PropTypes.string),
        cachedData: PropTypes.object,
    }).isRequired,
    onAdd: PropTypes.func,
    onRemove: PropTypes.func,
    isAdded: PropTypes.bool,
    rank: PropTypes.number,
};

export default ContentCard;