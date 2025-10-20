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
    } = useSortable({ id: item.externalId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const year = item.cachedData?.year || item.year || null;

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
                        style={{ width: '64px', height: '96px' }}
                        className="object-cover rounded"
                    />
                ) : (
                    <div style={{ width: '64px', height: '96px' }} className="bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center text-xs text-gray-500">
                        No image
                    </div>
                )}

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item.externalId);
                    }}
                    className="absolute -top-1 -left-1 bg-black bg-opacity-70 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-90 transition-opacity"
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
                {year && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {year}
                    </p>
                )}
                {item.cachedData?.artist && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {item.cachedData.artist}
                    </p>
                )}
            </div>

        </div>
    );
}

DraggableListItem.propTypes = {
    item: PropTypes.shape({
        externalId: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        cachedData: PropTypes.shape({
            posterUrl: PropTypes.string,
            releaseDate: PropTypes.string,
        }),
        releaseDate: PropTypes.string,
    }).isRequired,
    rank: PropTypes.number.isRequired,
    onRemove: PropTypes.func.isRequired,
};

export default DraggableListItem;