import { memo, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import LikeButton from './LikeButton';
import ConfirmModal from '../UI/ConfirmModal';

function CommentItem({
    comment,
    depth = 0,
    canReply = false,
    onReply,
    onLikeToggle,
    pendingLikeId,
    pendingReplyId,
    currentUserId,
    onEdit,
    onDelete,
    isEditPending,
    isDeletePending,
}) {
    const [replyVisible, setReplyVisible] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);


    const authorName = comment.user?.displayName || 'Anonymous';
    const createdAt = comment.createdAt ? new Date(comment.createdAt) : null;
    const editedAt = comment.editedAt ? new Date(comment.editedAt) : null;

    const formattedDate = useMemo(() => {
        if (!createdAt) return '';
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(createdAt);
    }, [createdAt]);

    const formattedEditedDate = useMemo(() => {
        if (!editedAt) return '';
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(editedAt);
    }, [editedAt]);

    const isOwner = currentUserId && comment.userId && String(comment.userId) === String(currentUserId);
    const isDeleted = comment.isDeleted;

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

    // Handle edit start
    const handleEditStart = () => {
        setEditText(comment.content);
        setIsEditing(true);
    };

    // Handle edit cancel
    const handleEditCancel = () => {
        setEditText(comment.content);
        setIsEditing(false);
    };

    // Handle edit submit
    const handleEditSubmit = async (event) => {
        event.preventDefault();
        if (!onEdit) return;
        const text = editText.trim();
        if (!text) return;
        const success = await onEdit(comment._id, text);
        if (success) {
            setIsEditing(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!onDelete) return;
        await onDelete(comment._id);
        setIsDeleteModalOpen(false);
    };

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
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
                    {comment.isEdited && formattedEditedDate && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                            (edited {formattedEditedDate})
                        </span>
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

            {isEditing ? (
                <form onSubmit={handleEditSubmit} className="mt-3 space-y-2">
                    <textarea
                        value={editText}
                        onChange={(event) => setEditText(event.target.value)}
                        rows={3}
                        maxLength={500}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2"
                        placeholder="Edit your comment…"
                        disabled={isEditPending}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={handleEditCancel}
                            disabled={isEditPending}
                            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-70"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isEditPending || !editText.trim()}
                            className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-70"
                        >
                            Save
                        </button>
                    </div>
                </form>
            ) : (
                <p className={`mt-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line break-words text-left ${isDeleted ? 'italic text-gray-400 dark:text-gray-500' : ''}`}>
                    {isDeleted ? 'This comment has been deleted' : comment.content}
                </p>
            )}

            <div className="mt-3 flex items-center gap-3 text-xs">
                {canReply && !isEditing && !isDeleted && (
                    <button
                        type="button"
                        onClick={() => setReplyVisible((prev) => !prev)}
                        className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                    >
                        {replyVisible ? 'Hide answer' : 'Reply'}
                    </button>
                )}
                {isOwner && !isEditing && !isDeleted && (
                    <>
                        <button
                            type="button"
                            onClick={handleEditStart}
                            disabled={isDeletePending}
                            className="font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition disabled:opacity-70"
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            disabled={isDeletePending}
                            className="font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition disabled:opacity-70"
                        >
                            Delete
                        </button>
                    </>
                )}
            </div>

            {replyVisible && canReply && !isEditing && !isDeleted && (
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
                            currentUserId={currentUserId}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            isEditPending={isEditPending}
                            isDeletePending={isDeletePending}
                        />
                    ))}
                </div>
            )}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Comment"
                message="Are you sure you want to delete this comment? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeletePending}
            />
        </article>
    );
}

CommentItem.propTypes = {
    comment: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        userId: PropTypes.string,
        user: PropTypes.shape({
            displayName: PropTypes.string,
        }),
        createdAt: PropTypes.string,
        editedAt: PropTypes.string,
        isEdited: PropTypes.bool,
        isDeleted: PropTypes.bool,
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
    currentUserId: PropTypes.string,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    isEditPending: PropTypes.bool,
    isDeletePending: PropTypes.bool,
};

export default memo(CommentItem);