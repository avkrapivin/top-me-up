import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useListByShareToken, useToggleListLike } from '../hooks/useListApi';
import ListCard from '../components/Lists/ListCard';
import Layout from '../components/Layout/Layout';
import LikeButton from '../components/Social/LikeButton';
import CommentsSection from '../components/Social/CommentsSection';
import PublicShareButton from '../components/Social/PublicShareButton';
import Skeleton from '../components/UI/Skeleton';
import NetworkError from '../components/UI/NetworkError';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import EmptyState from '../components/UI/EmptyState';

const NotFoundIcon = () => (
    <svg 
        className="w-24 h-24 text-gray-400 dark:text-gray-600" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M13.5 13.5L10.5 10.5M10.5 13.5l3-3" 
            opacity="0.5"
        />
    </svg>
);

function PublicList() {
    const navigate = useNavigate();
    const { token } = useParams();
    const { data: listData, isLoading, error } = useListByShareToken(token);
    const { showInfo, showError } = useToast();
    const { user } = useAuth();
    const list = listData?.data;
    const listId = list?._id;

    const toggleLikeMutation = useToggleListLike();

    const [likesState, setLikesState] = useState({ count: 0, isLiked: false });
    const [commentsCount, setCommentsCount] = useState(list?.commentsCount ?? 0);

    useEffect(() => {
        if (list) {
            setLikesState({
                count: list.likesCount ?? 0,
                isLiked: list.userHasLiked ?? false,
            });
            setCommentsCount(list.commentsCount ?? 0);
        }
    }, [list]);

    useEffect(() => {
        if (listData?.data) {
            const currentList = listData.data;
            const authorName = currentList.user?.displayName || 'User';

            // Remove old meta tags
            document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach(meta => meta.remove());

            // Create meta tags for Open Graph  
            const metaTags = [
                { property: 'og:title', content: `${currentList.title} by ${authorName}` },
                { property: 'og:description', content: currentList.description || `Top-10 ${currentList.category === 'movies' ? 'movies' : currentList.category === 'music' ? 'albums' : 'games'} by ${authorName} on TopMeUp` },
                { property: 'og:type', content: 'website' },
                { property: 'og:url', content: window.location.href },
                { property: 'og:site_name', content: 'TopMeUp' },
                { name: 'twitter:card', content: 'summary_large_image' },
                { name: 'twitter:title', content: `${currentList.title} by ${authorName}` },
                { name: 'twitter:description', content: currentList.description || `Top-10 ${currentList.category === 'movies' ? 'movies' : currentList.category === 'music' ? 'albums' : 'games'} by ${authorName}` },
            ];

            // If there is a poster of the first element - add image
            if (currentList.items?.[0]?.cachedData?.posterUrl) {
                metaTags.push(
                    { property: 'og:image', content: currentList.items[0].cachedData.posterUrl },
                    { property: 'og:image:width', content: '1200' },
                    { property: 'og:image:height', content: '630' },
                    { property: 'og:image:type', content: 'image/jpeg' },
                    { name: 'twitter:image', content: currentList.items[0].cachedData.posterUrl },
                    { name: 'twitter:image:alt', content: `${currentList.title} - ${currentList.items[0].title}` }
                );
            }

            metaTags.forEach(tag => {
                const meta = document.createElement('meta');
                if (tag.property) {
                    meta.setAttribute('property', tag.property);
                } else {
                    meta.setAttribute('name', tag.name);
                }
                meta.setAttribute('content', tag.content);
                document.head.appendChild(meta);
            });

            // Update page title
            document.title = `${currentList.title} - TopMeUp`;
        }

        return () => {
            // Clean up when unmounting
            document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach(meta => meta.remove());
        };
    }, [listData, token]);

    const handleLikeToggle = async (nextLiked) => {
        if (!user) {
            showInfo('Login to like lists');
            throw new Error('Authentication required');
        }
        if (!listId) return;

        try {
            const result = await toggleLikeMutation.mutateAsync({ listId, like: nextLiked });

            setLikesState({
                count: result.likesCount,
                isLiked: result.userHasLiked,
            });
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to toggle like';
            showError(message);
            throw err;
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="min-h-[calc(100vh-4rem)] bg-gray-100 dark:bg-gray-900 p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Header skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                            <Skeleton className="mb-2" width="60%" height="36px" />
                            <Skeleton className="mb-4" width="150px" height="20px" />
                            <Skeleton width="80%" height="16px" />
                        </div>
                        
                        {/* Items grid skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 max-w-xl mx-auto">
                            <div className="grid grid-cols-2 gap-4">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <Skeleton width="64px" height="96px" rounded="rounded" />
                                        <div className="flex-1">
                                            <Skeleton className="mb-1" width="90%" height="14px" />
                                            <Skeleton width="60%" height="12px" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Stats skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 max-w-xl mx-auto">
                            <div className="flex items-center justify-center gap-6">
                                <Skeleton width="80px" height="16px" />
                                <Skeleton width="60px" height="16px" />
                                <Skeleton width="60px" height="16px" />
                                <Skeleton width="80px" height="16px" />
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="min-h-[calc(100vh-4rem)] bg-gray-100 dark:bg-gray-900 p-8">
                    <div className="max-w-4xl mx-auto">
                        <NetworkError
                            error={error}
                            onRetry={() => {
                                window.location.reload();
                            }}
                            title="Failed to Load List"
                        />
                    </div>
                </div>
            </Layout>
        );
    }

    if (!list) {
        return (
            <Layout>
                <div className="min-h-[calc(100vh-4rem)] bg-gray-100 dark:bg-gray-900 p-8">
                    <div className="max-w-2xl mx-auto">
                        <EmptyState
                            icon={<NotFoundIcon />}
                            title="List not found"
                            message="This list doesn't exist, has been deleted, or is not available. You can browse other public lists or create your own."
                            actionLabel="Browse Lists"
                            onAction={() => navigate('/explore')}
                            className="bg-white dark:bg-gray-800"
                        />
                    </div>
                </div>
            </Layout>
        );
    }

    const authorName = list.user?.displayName || 'User';
    const shareUrl = token ? `${window.location.origin}/share/${token}` : null;

    return (
        <Layout>
            <div className="min-h-[calc(100vh-4rem)] bg-gray-100 dark:bg-gray-900 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {list.title}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                            by {authorName}
                        </p>
                        {list.description && (
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                {list.description}
                            </p>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-xl mx-auto">
                        <div className="grid grid-cols-2 gap-4">
                            {Array.from({ length: 10 }).map((_, index) => {
                                const item = list.items?.[index];
                                return item ? (
                                    <ListItemPreview key={item._id || item.externalId} item={item} />
                                ) : (
                                    <EmptySlot key={`empty-${index}`} category={list.category} />
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 max-w-xl mx-auto">
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-6">
                                <span>{list.items?.length || 0}/10 items</span>
                                {list.viewsCount > 0 && <span>{list.viewsCount} views</span>}
                                <LikeButton
                                    count={likesState.count}
                                    isLiked={likesState.isLiked}
                                    onToggle={handleLikeToggle}
                                    disabled={toggleLikeMutation.isPending}
                                    size="md"
                                    label="Like for list"
                                />
                                <span>
                                    {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
                                </span>
                            </div>
                            {shareUrl && (
                                <div className="ml-4">
                                    <PublicShareButton shareUrl={shareUrl} listTitle={list.title} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6">
                        <CommentsSection
                            listId={list._id}
                            initialCount={list.commentsCount ?? 0}
                            onCountChange={setCommentsCount}
                        />
                    </div>
                </div>
            </div>
        </Layout>
    );
}

// Components for displaying elements
function ListItemPreview({ item }) {
    const year = item.cachedData?.year || null;
    const posterConfig = {
        movies: { width: 64, height: 96, imageClass: 'object-cover' },
        music: { width: 64, height: 64, imageClass: 'object-cover' },
        games: { width: 96, aspectRatio: '16 / 9', imageClass: 'object-cover' },
    };
    const config = posterConfig[item.category] || posterConfig.movies;

    return (
        <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <div
                style={{
                    width: `${config.width}px`,
                    height: config.height ? `${config.height}px` : 'auto',
                    aspectRatio: config.aspectRatio || undefined,
                }}
                className="rounded overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700 flex-shrink-0"
            >
                <img
                    src={item.cachedData?.posterUrl || '/placeholder.png'}
                    alt={item.title}
                    className={`${config.imageClass} w-full h-full`}
                />
            </div>
            <div className="flex-1 pt-1 min-w-0">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                    {item.title}
                </h4>
                {item.category === 'music' && item.cachedData?.artist && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-1">
                        {item.cachedData.artist}
                    </p>
                )}
                {year && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {year}
                    </p>
                )}
            </div>
        </div>
    );
}

function EmptySlot({ category }) {
    const slotConfig = {
        movies: { width: 64, height: 96 },
        music: { width: 64, height: 64 },
        games: { width: 96, aspectRatio: '16 / 9' },
    };
    const config = slotConfig[category] || slotConfig.movies;

    return (
        <div className="flex items-start gap-2 p-2 rounded-lg">
            <div
                style={{
                    width: `${config.width}px`,
                    height: config.height ? `${config.height}px` : 'auto',
                    aspectRatio: config.aspectRatio || undefined,
                }}
                className="rounded shadow-md bg-gray-200 dark:bg-gray-700 flex-shrink-0"
            />
            <div className="flex-1" />
        </div>
    );
}

export default PublicList;