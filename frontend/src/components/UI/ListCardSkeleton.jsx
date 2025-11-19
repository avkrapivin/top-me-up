import Skeleton from './Skeleton';

// Skeleton for list card
function ListCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
            {/* Category badge */}
            <Skeleton className="mb-2" width="80px" height="20px" />
            
            {/* Title */}
            <Skeleton className="mb-2" width="75%" height="24px" />
            
            {/* Description */}
            <Skeleton className="mb-1" width="100%" height="16px" />
            <Skeleton className="mb-4" width="60%" height="16px" />
            
            {/* Author */}
            <Skeleton className="mb-4" width="120px" height="16px" />
            
            {/* Items grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <Skeleton width="64px" height="96px" rounded="rounded" />
                        <div className="flex-1">
                            <Skeleton className="mb-1" width="90%" height="14px" />
                            <Skeleton width="60%" height="12px" />
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Footer stats */}
            <div className="flex items-center justify-between">
                <Skeleton width="80px" height="16px" />
                <div className="flex gap-3">
                    <Skeleton width="60px" height="16px" />
                    <Skeleton width="60px" height="16px" />
                    <Skeleton width="60px" height="16px" />
                </div>
            </div>
        </div>
    );
}

export default ListCardSkeleton;