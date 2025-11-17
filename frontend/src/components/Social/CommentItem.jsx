import { memo, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import LikeButton from './LikeButton';

function CommentItem({
    comment,
    depth = 0,
    canReply = false,
    onReply,
    onLikeToggle,
    pendingLikeId,
    pendingReplyId,
}) {
    const [replyVisible, setReplyVisible] = useState(false);
    const [replyText, setReplyText] = useState('');

    const authorName = comment.user?.displayName || 'Anonymous';
    const createdAt = comment.createdAt ? new Date(comment.createdAt) : null;
    const formattedDate = useMemo(() => {
        if (!createdAt) return '';
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(createdAt);
    }, [createdAt]);

    const handleLike = (nextLiked) => onLikeToggle?.(comment._id, nextLiked);

    const handleReplySubmit = async (event) => {
        event.preventDefault();
        if (!onReply) return;
        const text = replyText.trim();
        if (!text) return;
        const success = await onReply(comment._id, text);
        if (success) {
            setReplyText('');
            setReplyVisible(false);
        }
    };

    const isLikePending = pendingLikeId === comment._id;
    const isReplyPending = pendingReplyId === comment._id;
    const containerOffset =
        depth > 0 ? 'pl-6 border-l-2 border-gray-200 dark:border-gray-700' : '';

    return (
        <article
            className={`rounded-lg bg-gray-50 dark:bg-gray-900 p-4 transition ${containerOffset}`}
            data-comment-id={comment._id}
        >
            <header className="flex items-center justify-between gap-3">
                <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {authorName}
                    </p>
                    {formattedDate && (
                        <time className="text-xs text-gray-500 dark:text-gray-400">
                            {formattedDate}
                        </time>
                    )}
                </div>
                <LikeButton
                    isLiked={Boolean(comment.userHasLiked)}
                    count={comment.likesCount ?? 0}
                    onToggle={handleLike}
                    disabled={isLikePending}
                    size="sm"
                    label="Like for comment"
                />
            </header>

            <p className="mt-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line break-words text-left">
                {comment.content}
            </p>

            <div className="mt-3 flex items-center gap-3 text-xs">
                {canReply && (
                    <button
                        type="button"
                        onClick={() => setReplyVisible((prev) => !prev)}
                        className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                    >
                        {replyVisible ? 'Hide answer' : 'Reply'}
                    </button>
                )}
            </div>

            {replyVisible && canReply && (
                <form onSubmit={handleReplySubmit} className="mt-3 space-y-2">
                    <textarea
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        rows={3}
                        maxLength={500}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2"
                        placeholder="Write answer…"
                        disabled={isReplyPending}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setReplyVisible(false)}
                            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isReplyPending}
                            className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-70"
                        >
                            Reply
                        </button>
                    </div>
                </form>
            )}

            {comment.replies?.length > 0 && (
                <div className="mt-4 space-y-3">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply._id}
                            comment={reply}
                            depth={depth + 1}
                            canReply={canReply}
                            onReply={onReply}
                            onLikeToggle={onLikeToggle}
                            pendingLikeId={pendingLikeId}
                            pendingReplyId={pendingReplyId}
                        />
                    ))}
                </div>
            )}
        </article>
    );
}

CommentItem.propTypes = {
    comment: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        user: PropTypes.shape({
            displayName: PropTypes.string,
        }),
        createdAt: PropTypes.string,
        likesCount: PropTypes.number,
        userHasLiked: PropTypes.bool,
        replies: PropTypes.array,
    }).isRequired,
    depth: PropTypes.number,
    canReply: PropTypes.bool,
    onReply: PropTypes.func,
    onLikeToggle: PropTypes.func,
    pendingLikeId: PropTypes.string,
    pendingReplyId: PropTypes.string,
};

export default memo(CommentItem);