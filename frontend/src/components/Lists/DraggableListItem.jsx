import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PropTypes from 'prop-types';

const getPosterConfig = (category) => {
    switch (category) {
        case 'music':
            return {
                style: { width: '64px', height: '64px' },
                imageClass: 'object-cover',
                containerClass: 'bg-gray-200 dark:bg-gray-700',
            };
        case 'games':
            return {
                style: { width: '96px', aspectRatio: '16 / 9', height: 'auto' },
                imageClass: 'object-cover',
                containerClass: 'bg-gray-200 dark:bg-gray-700',
            };
        default:
            return {
                style: { width: '64px', height: '96px' },
                imageClass: 'object-cover',
                containerClass: 'bg-gray-200 dark:bg-gray-700',
            };
    }
};


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
    const posterConfig = getPosterConfig(item.category);
    const posterUrl = item.cachedData?.posterUrl;

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
                <div
                    style={posterConfig.style}
                    className={`
                        rounded overflow-hidden flex items-center justify-center
                        ${posterConfig.containerClass || ''}
                    `}
                >
                    {posterUrl ? (
                        <img
                            src={posterUrl}
                            alt={item.title}
                            className={`${posterConfig.imageClass} w-full h-full`}
                        />
                    ) : (
                        <div className="text-xs text-gray-300 dark:text-gray-500">
                            No image
                        </div>
                    )}
                </div>

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