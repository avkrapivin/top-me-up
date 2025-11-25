import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const sizeConfig = {
    sm: { button: 'text-xs px-2 py-1', icon: 'w-4 h-4', gap: 'gap-1' },
    md: { button: 'text-sm px-3 py-1.5', icon: 'w-5 h-5', gap: 'gap-1.5' },
    lg: { button: 'text-base px-3.5 py-2', icon: 'w-6 h-6', gap: 'gap-2' },
};

function LikeButton({ isLiked, count, onToggle, disabled = false, size = 'md', className = '', label = 'Like' }) {
    const [optimisticLiked, setOptimisticLiked] = useState(isLiked);
    const [optimisticCount, setOptimisticCount] = useState(count);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        setOptimisticLiked(isLiked);
    }, [isLiked]);

    useEffect(() => {
        setOptimisticCount(count);
    }, [count]);

    const handleClick = async () => {
        if (disabled || isProcessing || !onToggle) return;

        setIsProcessing(true);

        const previousLiked = optimisticLiked;
        const previousCount = optimisticCount;
        const nextLiked = !previousLiked;

        setOptimisticLiked(nextLiked);
        setOptimisticCount(Math.max(0, previousCount + (nextLiked ? 1 : -1)));

        try {
            await onToggle(nextLiked);
        } catch (error) {
            setOptimisticLiked(previousLiked);
            setOptimisticCount(previousCount);
            setIsProcessing(false);
            throw error;
        }

        setIsProcessing(false);
    };

    const config = sizeConfig[size] ?? sizeConfig.md;

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled || isProcessing || !onToggle}
            aria-pressed={optimisticLiked}
            title={optimisticLiked ? 'Remove like' : 'Add like'}
            className={`inline-flex items-center ${config.gap} rounded-full border transition-all duration-200 font-medium ${
                optimisticLiked
                    ? 'bg-rose-500 border-rose-500 text-white hover:bg-rose-600 hover:scale-110 active:scale-95'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-rose-400 hover:scale-110 active:scale-95'
            } ${disabled || isProcessing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} ${config.button} ${className}`}
        >
            <svg
                className={`${config.icon}`}
                viewBox="0 0 24 24"
                fill={optimisticLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.172 5.172a4.5 4.5 0 0 1 6.364 0L12 7.636l2.464-2.464a4.5 4.5 0 0 1 6.364 6.364L12 20.364l-8.828-8.828a4.5 4.5 0 0 1 0-6.364z"
                />
            </svg>
            <span>{optimisticCount}</span>
            <span className="sr-only">{label}</span>
        </button>
    );
}

LikeButton.propTypes = {
    isLiked: PropTypes.bool,
    count: PropTypes.number,
    onToggle: PropTypes.func,
    disabled: PropTypes.bool,
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    className: PropTypes.string,
    label: PropTypes.string,
};

export default LikeButton;