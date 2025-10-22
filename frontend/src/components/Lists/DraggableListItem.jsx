import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PropTypes from 'prop-types';

function DraggableListItem({ item, rank, onRemove }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const year = item.cachedData?.year || item.year || null;

    const getPosterDimensions = () => {
        if (item.category === 'music') {
            return { width: '64px', height: '64px' };
        }
        return { width: '64px', height: '96px' };
    }

    const posterDimensions = getPosterDimensions();

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                flex items-start gap-2 p-2 rounded-lg transition-all duration-200
                ${isDragging ? 'shadow-lg z-10 bg-white dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
            `}
        >
            <div
                {...attributes}
                {...listeners}
                className="relative flex-shrink-0 cursor-grab active:cursor-grabbing"
            >
                {item.cachedData?.posterUrl ? (
                    <img
                        src={item.cachedData.posterUrl}
                        alt={item.title}
                        style={posterDimensions}
                        className="object-cover rounded"
                    />
                ) : (
                    <div style={posterDimensions} className="bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center text-xs text-gray-500">
                        No image
                    </div>
                )}

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item.id);
                    }}
                    className="absolute -top-1 -left-1 bg-black bg-opacity-70 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-90 transition-opacity cursor-pointer"
                    title="Remove from list"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            {/* Info */}
            <div className="flex-1 pt-1 min-w-0">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                    {item.title}
                </h4>
                {item.category === 'music' && (item.cachedData?.artist || item.artist) && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-1">
                        {item.cachedData?.artist || item.artist}
                    </p>
                )}
                {year && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {year}
                    </p>
                )}
            </div>

        </div>
    );
}

DraggableListItem.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.string.isRequired,
        externalId: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        category: PropTypes.oneOf(['movies', 'music', 'games']).isRequired,
        cachedData: PropTypes.shape({
            posterUrl: PropTypes.string,
            year: PropTypes.number,
            artist: PropTypes.string,
        }),
    }).isRequired,
    rank: PropTypes.number.isRequired,
    onRemove: PropTypes.func.isRequired,
};

export default DraggableListItem;