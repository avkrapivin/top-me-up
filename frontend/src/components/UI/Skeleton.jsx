// Base Skeleton component for reuse
function Skeleton({ className = '', width, height, rounded = 'rounded' }) {
    return (
        <div
            className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${rounded} ${className}`}
            style={{
                width: width || '100%',
                height: height || '1rem',
            }}
        />
    );
}

export default Skeleton;