// Utilities for determining error types
export const isNetworkError = (error) => {
    if (!error) return false;
    
    // Axios network errors
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        return true;
    }
    
    // No response means network issue
    if (!error.response) {
        return true;
    }
    
    // Timeout errors
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        return true;
    }
    
    // Network error message
    if (error.message?.includes('Network Error') || error.message?.includes('network')) {
        return true;
    }
    
    return false;
};

export const getErrorMessage = (error) => {
    if (!error) return 'An unknown error occurred';
    
    if (isNetworkError(error)) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            return 'Request timed out. Please check your connection and try again.';
        }
        return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    if (error.response) {
        const status = error.response.status;
        if (status >= 500) {
            return 'Server error. Please try again later.';
        }
        if (status === 404) {
            return 'Resource not found.';
        }
        if (status === 403) {
            return 'You do not have permission to perform this action.';
        }
        if (status === 401) {
            return 'Please log in to continue.';
        }
        return error.response.data?.message || error.response.data?.error || `Error ${status}`;
    }
    
    return error.message || 'An error occurred';
};