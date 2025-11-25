import PropTypes from 'prop-types';

function EmptyState({ 
    icon, 
    title, 
    message, 
    actionLabel, 
    onAction,
    className = '' 
}) {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center ${className}`}>
            {/* Icon */}
            <div className="flex justify-center mb-6">
                {icon}
            </div>
            
            {/* Title */}
            {title && (
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {title}
                </h3>
            )}
            
            {/* Message */}
            {message && (
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    {message}
                </p>
            )}
            
            {/* Action Button */}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

EmptyState.propTypes = {
    icon: PropTypes.node.isRequired,
    title: PropTypes.string,
    message: PropTypes.string,
    actionLabel: PropTypes.string,
    onAction: PropTypes.func,
    className: PropTypes.string,
};

export default EmptyState;