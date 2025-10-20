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

    const year = item.cachedData?.releaseDate
        ? new Date(item.cachedData.releaseDate).getFullYear()
        : item.releaseDate
            ? new Date(item.releaseDate).getFullYear()
            : null;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                flex items-start gap-3 p-2 rounded-lg transition-all duration-200
                ${isDragging ? 'shadow-lg z-10' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
            `}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-1"
            >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8h16M4 16h16"
                    />
                </svg>
            </button>

            {/* Poster */}
            <div className="relative flex-shrink-0">
                {item.cachedData?.posterUrl ? (
                    <img
                        src={item.cachedData.posterUrl}
                        alt={item.title}
                        className="w-[100px] h-[150px] object-cover rounded"
                    />
                ) : (
                    <div className="w-[100px] h-[150px] bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center text-xs text-gray-500">
                        No image
                    </div>
                )}

                {/* Rank badge */}
                <div className="absolute -top-1 -left-1 bg-black bg-opacity-70 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {rank}
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 pt-2">
                <h4 className="font-semibold text-base text-gray-900 dark:text-white line-clamp-2 mb-1">
                    {item.title}
                </h4>
                {year && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {year}
                    </p>
                )}
                {item.cachedData?.artist && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                        {item.cachedData.artist}
                    </p>
                )}
            </div>

            {/* Remove Button */}
            <button
                onClick={() => onRemove(item.externalId)}
                className="flex-shrink-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mt-1"
                title="Remove from list"
            >
                <svg
                    className="w-5 h-5"
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