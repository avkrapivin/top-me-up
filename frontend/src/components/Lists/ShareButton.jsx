import { useState } from 'react';
import { useGenerateShareToken } from '../../hooks/useListApi';
import { useToast } from '../../contexts/ToastContext';

const ShareButton = ({ listId, listTitle, isPublic }) => {
    const [shareUrl, setShareUrl] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const generateTokenMutation = useGenerateShareToken();
    const { showSuccess, showError } = useToast();

    const handleGenerateShare = async () => {
        if (!isPublic) {
            showError('List must be public to share');
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateTokenMutation.mutateAsync(listId);
            setShareUrl(result.data.shareUrl);
            await navigator.clipboard.writeText(result.data.shareUrl);
            showSuccess('Public link copied to clipboard!');
        } catch (error) {
            console.error('Failed to generate share link:', error);
            showError('Failed to generate share link');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyLink = async () => {
        if (shareUrl) {
            await navigator.clipboard.writeText(shareUrl);
            showSuccess('Link copied!');
        }
    };

    const getSocialShareUrl = (platform) => {
        if (!shareUrl) return '#';
        const encodedUrl = encodeURIComponent(shareUrl);
        const encodedTitle = encodeURIComponent(listTitle || 'TopMeUp List');
        
        const urls = {
            twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
        };
        
        return urls[platform] || '#';
    };

    return (
        <div className="relative">
            <button
                onClick={handleGenerateShare}
                disabled={!isPublic || isGenerating}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isGenerating ? 'Generating...' : 'Share'}
            </button>

            {shareUrl && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-[300px] z-50 border border-gray-200 dark:border-gray-700">
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Public link:
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={shareUrl}
                                readOnly
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <button
                                onClick={handleCopyLink}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition"
                            >
                                Copy
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Share on social media:</p>
                        <div className="flex gap-2">
                            <a
                                href={getSocialShareUrl('twitter')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 px-3 py-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white text-sm rounded-md text-center transition"
                            >
                                Twitter
                            </a>
                            <a
                                href={getSocialShareUrl('facebook')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 px-3 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white text-sm rounded-md text-center transition"
                            >
                                Facebook
                            </a>
                            <a
                                href={getSocialShareUrl('telegram')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 px-3 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-sm rounded-md text-center transition"
                            >
                                Telegram
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShareButton;