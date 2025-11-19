import Skeleton from './Skeleton';

// Skeleton for comment
function CommentSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 animate-pulse">
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <Skeleton width="40px" height="40px" rounded="rounded-full" />
                
                <div className="flex-1">
                    {/* Author name and date */}
                    <div className="flex items-center gap-2 mb-2">
                        <Skeleton width="100px" height="16px" />
                        <Skeleton width="80px" height="14px" />
                    </div>
                    
                    {/* Comment text */}
                    <Skeleton className="mb-2" width="100%" height="16px" />
                    <Skeleton className="mb-2" width="80%" height="16px" />
                    
                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-2">
                        <Skeleton width="60px" height="20px" />
                        <Skeleton width="60px" height="20px" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CommentSkeleton;