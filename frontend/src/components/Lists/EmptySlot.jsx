import PropTypes from 'prop-types';

function EmptySlot({ rank, isDropTarget = false }) {
    return (
        <div className="flex items-start gap-2 p-2">
            <div
                style={{ width: '64px', height: '96px' }}
                className={`
                    rounded flex-shrink-0 transition-all duration-200 relative
                    ${isDropTarget
                        ? 'bg-blue-100 dark:bg-blue-900 border-2 border-dashed border-blue-500 dark:border-blue-400'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }
                `}
            />

            <div className="flex-1 pt-1" />
        </div>
    );
}

EmptySlot.propTypes = {
    rank: PropTypes.number,
    isDropTarget: PropTypes.bool,
};

export default EmptySlot;