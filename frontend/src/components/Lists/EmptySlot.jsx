import PropTypes from 'prop-types';

const slotConfig = {
    movies: { width: '64px', height: '96px', aspectRatio: undefined, bg: 'bg-gray-200 dark:bg-gray-700' },
    music: { width: '64px', height: '64px', aspectRatio: undefined, bg: 'bg-gray-200 dark:bg-gray-700' },
    games: { width: '96px', height: 'auto', aspectRatio: '16 / 9', bg: 'bg-gray-200 dark:bg-gray-700' }, 
};

const getSlotDimensions = (category) => slotConfig[category] || slotConfig.movies;

function EmptySlot({ rank, isDropTarget = false, category = 'movies' }) {
    const slotDimensions = getSlotDimensions(category);

    return (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left p-2">
            <div
                style={{
                    width: slotDimensions.width,
                    height: slotDimensions.height,
                    aspectRatio: slotDimensions.aspectRatio,
                }}
                className={`
                    rounded flex-shrink-0 transition-all duration-200 relative overflow-hidden
                    ${isDropTarget
                        ? 'bg-blue-100 dark:bg-blue-900 border-2 border-dashed border-blue-500 dark:border-blue-400'
                        : slotDimensions.bg
                    }
                `}
            />
            <div className="flex-1 pt-3 sm:pt-1 w-full" />
        </div>
    );
}

EmptySlot.propTypes = {
    rank: PropTypes.number,
    isDropTarget: PropTypes.bool,
    category: PropTypes.oneOf(['movies', 'music', 'games']),
};

export default EmptySlot;