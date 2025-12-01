import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../contexts/ToastContext';

const PublicShareButton = ({ shareUrl, listTitle }) => {
    const [showSharePanel, setShowSharePanel] = useState(false);
    const panelRef = useRef(null);
    const { showSuccess } = useToast();

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setShowSharePanel(false);
            }
        };

        if (showSharePanel) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSharePanel]);

    // Copy link handler
    const handleCopyLink = async () => {
        if (shareUrl) {
            try {
                await navigator.clipboard.writeText(shareUrl);
                showSuccess('Link copied to clipboard!');
                setShowSharePanel(false);
            } catch (err) {
                // Fallback for old browsers
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showSuccess('Link copied to clipboard!');
                setShowSharePanel(false);
            }
        }
    };

    // Generate URL for social networks
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

    // Use Web Share API if available
    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: listTitle || 'TopMeUp List',
                    url: shareUrl,
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error sharing:', err);
                }
            }
        } else {
            setShowSharePanel(true);
        }
    };

    if (!shareUrl) return null;

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={handleNativeShare}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition flex items-center gap-2"
                aria-label="Share list"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
            </button>

            {showSharePanel && (
                <>
                    {/* Mobile fullscreen modal */}
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 sm:hidden">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full mx-4 max-w-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Share List</h2>
                                <button
                                    onClick={() => setShowSharePanel(false)}
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Share link:
                                </label>
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="text"
                                        value={shareUrl}
                                        readOnly
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        onClick={(e) => e.target.select()}
                                    />
                                    <button
                                        onClick={handleCopyLink}
                                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition"
                                        aria-label="Copy link"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Share on social media:</p>
                                <div className="flex flex-col gap-2">
                                    <a
                                        href={getSocialShareUrl('twitter')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full px-3 py-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white text-sm rounded-md text-center transition"
                                    >
                                        Twitter
                                    </a>
                                    <a
                                        href={getSocialShareUrl('facebook')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full px-3 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white text-sm rounded-md text-center transition"
                                    >
                                        Facebook
                                    </a>
                                    <a
                                        href={getSocialShareUrl('telegram')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full px-3 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-sm rounded-md text-center transition"
                                    >
                                        Telegram
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop modal - visible only on desktop */}
                    <div className="hidden sm:block absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-[300px] z-50 border border-gray-200 dark:border-gray-700">
                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Share link:
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={shareUrl}
                                    readOnly
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    onClick={(e) => e.target.select()}
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition"
                                    aria-label="Copy link"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Share on social media:</p>
                            <div className="grid grid-cols-2 gap-2">
                                <a
                                    href={getSocialShareUrl('twitter')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white text-sm rounded-md text-center transition"
                                >
                                    Twitter
                                </a>
                                <a
                                    href={getSocialShareUrl('facebook')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white text-sm rounded-md text-center transition"
                                >
                                    Facebook
                                </a>
                                <a
                                    href={getSocialShareUrl('telegram')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-sm rounded-md text-center transition"
                                >
                                    Telegram
                                </a>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PublicShareButton;