import PropTypes from 'prop-types';

// Component for displaying network errors with a retry button
function NetworkError({ error, onRetry, title = 'Connection Error', className = '' }) {
    const isNetworkError = !error?.response || error.code === 'ECONNABORTED' || error.message?.includes('Network Error');
    
    const getErrorMessage = () => {
        if (isNetworkError) {
            return 'Unable to connect to the server. Please check your internet connection.';
        }
        if (error?.response?.status === 408 || error?.code === 'ECONNABORTED') {
            return 'Request timed out. Please try again.';
        }
        if (error?.response?.status >= 500) {
            return 'Server error. Please try again later.';
        }
        return error?.message || 'An error occurred. Please try again.';
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center ${className}`}>
            <div className="mb-4">
                <svg
                    className="mx-auto h-12 w-12 text-red-500 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {getErrorMessage()}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
                >
                    Try Again
                </button>
            )}
        </div>
    );
}

NetworkError.propTypes = {
    error: PropTypes.object,
    onRetry: PropTypes.func,
    title: PropTypes.string,
    className: PropTypes.string,
};

export default NetworkError;