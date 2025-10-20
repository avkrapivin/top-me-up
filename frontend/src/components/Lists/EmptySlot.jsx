import PropTypes from 'prop-types';

function EmptySlot({ rank, isDropTarget = false }) {
    return (
        <div className="flex items-start gap-3">
            {/* Empty poster placeholder */}
            <div
                className={`
                    w-[100px] h-[150px] rounded flex-shrink-0 transition-all duration-200
                    ${isDropTarget
                        ? 'bg-blue-100 dark:bg-blue-900 border-2 border-dashed border-blue-500 dark:border-blue-400'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }
                `}
            >
                {/* Rank badge (optional) */}
                {rank && (
                    <div className="relative w-full h-full">
                        <div className="absolute -top-1 -left-1 bg-gray-400 dark:bg-gray-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {rank}
                        </div>
                    </div>
                )}
            </div>

            {/* Empty info */}
            <div className="flex-1 pt-2">
                {isDropTarget ? (
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        Drop here
                    </p>
                ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        Empty slot
                    </p>
                )}
            </div>
        </div>
    );
}

EmptySlot.propTypes = {
    rank: PropTypes.number,
    isDropTarget: PropTypes.bool,
};

export default EmptySlot;