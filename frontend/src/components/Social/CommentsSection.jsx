import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import {
    listCommentsKey,
    useListComments,
    useCreateComment,
    useToggleCommentLike,
    useUpdateComment,
    useDeleteComment,
} from '../../hooks/useListApi';
import CommentItem from './CommentItem';
import CommentSkeleton from '../UI/CommentSkeleton';
import NetworkError from '../UI/NetworkError';
import PropTypes from 'prop-types';
import { useUserProfile } from '../../hooks/useAuthApi';

function debounce(func, wait) {
    let timeout;
    const debounced = function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
    debounced.cancel = () => clearTimeout(timeout);
    return debounced;
}

function CommentsSection({ listId, initialCount = 0, onCountChange }) {
    const { user } = useAuth();
    const { showInfo, showError, showSuccess } = useToast();
    const queryClient = useQueryClient();
    const lastCreatedIdRef = useRef(null);

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        error,
    } = useListComments(listId, {
        onError: (err) => {
            console.error('Error fetching comments:', err);
            showError('Failed to load comments');
        },
    });

    const createComment = useCreateComment(listId);
    const toggleCommentLike = useToggleCommentLike();
    const updateComment = useUpdateComment(listId);
    const deleteComment = useDeleteComment(listId);

    const { data: userProfile } = useUserProfile(!!user);
    const currentUserId = userProfile?._id || null;

    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingLikeId, setPendingLikeId] = useState(null);
    const [pendingReplyId, setPendingReplyId] = useState(null);

    const comments = useMemo(() => {
        if (!data?.pages?.length) return [];
        return data.pages.flatMap((page) => page.data || []);
    }, [data]);

    const totalCount = useMemo(() => {
        return initialCount ?? data?.pages?.[0]?.pagination?.total ?? 0;
    }, [initialCount, data]);

    useEffect(() => {
        onCountChange?.(totalCount);
    }, [totalCount, onCountChange]);

    const debouncedRefetch = useCallback(
        debounce(() => {
            refetch();
        }, 500),
        [refetch]
    );

    useEffect(() => {
        return () => debouncedRefetch.cancel();
    }, [debouncedRefetch]);

    const updateCommentInCache = useCallback(
        (commentId, updater) => {
            const queryKey = listCommentsKey(listId);
            queryClient.setQueryData(queryKey, (prev) => {
                if (!prev?.pages) return prev;

                let wasChanged = false;

                const walk = (items = []) => {
                    let changed = false;
                    const nextItems = items.map((item) => {
                        if (item._id === commentId) {
                            changed = true;
                            wasChanged = true;
                            return updater(item);
                        }

                        if (item.replies?.length) {
                            const { nextReplies, repliesChanged } = walk(item.replies);
                            if (repliesChanged) {
                                changed = true;
                                wasChanged = true;
                                return { ...item, replies: nextReplies };
                            }
                        }

                        return item;
                    });

                    return { nextItems, changed };
                };

                const nextPages = prev.pages.map((page) => {
                    const { nextItems, changed } = walk(page.data || []);
                    if (!changed) return page;
                    return { ...page, data: nextItems };
                });

                if (!wasChanged) return prev;
                return { ...prev, pages: nextPages };
            });
        },
        [listId, queryClient]
    );

    const handleLikeToggle = useCallback(
        async (commentId, shouldLike) => {
            if (!user) {
                showInfo('Login to like comments');
                return false;
            }

            setPendingLikeId(commentId);

            try {
                const result = await toggleCommentLike.mutateAsync({ commentId, like: shouldLike });
                updateCommentInCache(result.commentId, (comment) => ({
                    ...comment,
                    likesCount: result.likesCount,
                    userHasLiked: result.userHasLiked,
                }));
                return true;
            } catch (error) {
                const message =
                    error.response?.data?.message || 'Failed to update comment like';
                showError(message);
                return false;
            } finally {
                setPendingLikeId(null);
            }
        },
        [toggleCommentLike, showError, showInfo, updateCommentInCache, user]
    );

    // Handle edit comment
    const handleEditComment = useCallback(
        async (commentId, content) => {
            try {
                await updateComment.mutateAsync({ commentId, content });
                showSuccess('Comment updated successfully');
                return true;
            } catch (error) {
                showError(error.response?.data?.message || 'Failed to update comment');
                return false;
            }
        },
        [updateComment, showSuccess, showError]
    );

    // Handle delete comment
    const handleDeleteComment = useCallback(
        async (commentId) => {
            try {
                await deleteComment.mutateAsync(commentId);
                showSuccess('Comment deleted successfully');
                if (onCountChange) {
                    const newCount = Math.max(0, totalCount - 1);
                    onCountChange(newCount);
                }
            } catch (error) {
                showError(error.response?.data?.message || 'Failed to delete comment');
            }
        },
        [deleteComment, showSuccess, showError, totalCount, onCountChange]
    );

    const handleReply = useCallback(
        async (parentCommentId, content) => {
            if (!user) {
                showInfo('Login to reply to comments');
                return false;
            }

            const trimmed = content.trim();
            if (!trimmed) {
                showInfo('Enter text of answer');
                return false;
            }

            setPendingReplyId(parentCommentId);

            try {
                const { data: created } = await createComment.mutateAsync({
                    content: trimmed,
                    parentCommentId,
                });

                const newId = created?._id?.toString();
                lastCreatedIdRef.current = newId || null;

                setTimeout(() => {
                    debouncedRefetch();
                }, 0);

                showSuccess('Answer published');
                return true;
            } catch (error) {
                const message =
                    error.response?.data?.message || 'Failed to send answer';
                showError(message);
                return false;
            } finally {
                setPendingReplyId(null);
            }
        },
        [createComment, debouncedRefetch, showError, showInfo, showSuccess, user]
    );

    const handleNewCommentSubmit = async (event) => {
        event.preventDefault();

        if (!user) {
            showInfo('Login to leave comments');
            setNewComment(newComment.trim());
            return;
        }

        const trimmed = newComment.trim();
        if (!trimmed) {
            showInfo('Enter text of comment');
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: created } = await createComment.mutateAsync({ content: trimmed });
            const newId = created?._id?.toString();
            lastCreatedIdRef.current = newId || null;

            setNewComment('');
            debouncedRefetch();
            showSuccess('Comment published');
        } catch (error) {
            const message =
                error.response?.data?.message || 'Failed to send comment';
            showError(message);
            setNewComment(trimmed);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (!lastCreatedIdRef.current) return;

        const scrollToComment = () => {
            const selector = `[data-comment-id="${lastCreatedIdRef.current}"]`;
            const element = document.querySelector(selector);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                lastCreatedIdRef.current = null;
            }
        };

        const timer = setTimeout(scrollToComment, 120);
        return () => clearTimeout(timer);
    }, [comments]);

    return (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Comments
            </h2>

            {user ? (
                <form onSubmit={handleNewCommentSubmit} className="mt-4 space-y-3">
                    <textarea
                        value={newComment}
                        onChange={(event) => setNewComment(event.target.value)}
                        rows={4}
                        maxLength={500}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 px-4 py-2"
                        placeholder="Share your thoughts…"
                        disabled={isSubmitting}
                    />
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-70"
                        >
                            Send
                        </button>
                    </div>
                </form>
            ) : (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    Login to like or comment on lists.
                </p>
            )}

            {isLoading ? (
                <div className="mt-6 space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <CommentSkeleton key={`comment-skeleton-${index}`} />
                    ))}
                </div>
            ) : error ? (
                <div className="mt-6">
                    <NetworkError
                        error={error}
                        onRetry={() => refetch()}
                        title="Failed to Load Comments"
                        className="p-4"
                    />
                </div>
            ) : comments.length === 0 ? (
                <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No comments yet — be the first!
                </p>
            ) : (
                <div className="mt-6 space-y-4">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment._id}
                            comment={comment}
                            depth={0}
                            canReply={Boolean(user)}
                            onReply={handleReply}
                            onLikeToggle={handleLikeToggle}
                            pendingLikeId={pendingLikeId}
                            pendingReplyId={pendingReplyId}
                            currentUserId={currentUserId}
                            onEdit={handleEditComment}
                            onDelete={handleDeleteComment}
                            isEditPending={updateComment.isPending}
                            isDeletePending={deleteComment.isPending}
                        />
                    ))}
                </div>
            )}

            {hasNextPage && (
                <div className="mt-6 flex justify-center">
                    <button
                        type="button"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-70"
                    >
                        {isFetchingNextPage ? 'Loading…' : 'Show more comments'}
                    </button>
                </div>
            )}
        </section>
    );
}

CommentsSection.propTypes = {
    listId: PropTypes.string.isRequired,
    initialCount: PropTypes.number,
    onCountChange: PropTypes.func,
};

export default CommentsSection;