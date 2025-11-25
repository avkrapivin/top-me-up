import { useState, useEffect } from 'react';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        const showTimer = setTimeout(() => setIsVisible(true), 100);

        if (duration) {
            const hideTimer = setTimeout(() => {
                setIsLeaving(true);
                setTimeout(() => onClose(), 300);
            }, duration);

            return () => {
                clearTimeout(showTimer);
                clearTimeout(hideTimer);
            };
        }

        return () => clearTimeout(showTimer);
    }, [duration, onClose]);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(() => onClose(), 300);
    };

    const getToastStyles = () => {
        const baseStyles = "px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform";

        const animationStyles = isVisible && !isLeaving
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-full opacity-0 scale-95";

        switch (type) {
            case 'success':
                return `${baseStyles} ${animationStyles} bg-green-500 text-white`;
            case 'error':
                return `${baseStyles} ${animationStyles} bg-red-500 text-white`;
            case 'warning':
                return `${baseStyles} ${animationStyles} bg-yellow-500 text-black`;
            default:
                return `${baseStyles} ${animationStyles} bg-blue-500 text-white`;
        }
    };

    return (
        <div className={getToastStyles()}>
            <div className="flex items-center">
                <span className="flex-1">{message}</span>
                <button
                    onClick={handleClose}
                    className="ml-3 text-white hover:text-gray-200 dark:hover:text-gray-300 transition-colors p-1 rounded hover:bg-white/20"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default Toast;