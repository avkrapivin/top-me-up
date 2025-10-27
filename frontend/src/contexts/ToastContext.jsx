import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Toast from '../components/UI/Toast';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const MAX_TOASTS = 3;

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        const newToast = { id, message, type, duration };

        setToasts(prev => {
            const newToasts = [...prev, newToast];
            if (newToasts.length > MAX_TOASTS) {
                return newToast.slice(-MAX_TOASTS);
            }
            return newToasts;
        });

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showSuccess = useCallback((message, duration) =>
        addToast(message, 'success', duration), [addToast]);

    const showError = useCallback((message, duration) =>
        addToast(message, 'error', duration), [addToast]);

    const showWarning = useCallback((message, duration) =>
        addToast(message, 'warning', duration), [addToast]);

    const showInfo = useCallback((message, duration) =>
        addToast(message, 'info', duration), [addToast]);

    const showLoading = useCallback((message) =>
        addToast(message, 'info', 0), [addToast]);

    const hideLoading = useCallback((toastId) => {
        removeToast(toastId);
    }, [removeToast]);

    const value = {
        toasts,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showLoading,
        hideLoading,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
                {toasts.map((toast, index) => (
                    <div
                        key={toast.id}
                        className="pointer-events-auto transform transition-all duration-300 ease-in-out"
                        style={{
                            transform: `translateY(${index * 10}px) scale(${1 - index * 0.05})`,
                            opacity: 1 - index * 0.2,
                            zIndex: 1000 - index
                        }}
                    >
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            duration={toast.duration}
                            onClose={() => removeToast(toast.id)}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};