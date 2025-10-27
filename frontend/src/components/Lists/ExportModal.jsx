import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '../../contexts/ToastContext';

const ExportModal = ({ isOpen, onClose, listData }) => {
    const [isExporting, setIsExporting] = useState(false);
    const { showSuccess, showError, showWarning, showLoading, hideLoading } = useToast();

    if (!isOpen) return null;

    const isEmpty = !listData.items || listData.items.length === 0;

    const getImageUrl = (url) => {
        if (!url) return url;

        return url;
    };

    const handleExportPDF = async () => {
        if (isEmpty) {
            showError('Cannot export empty list. Add some items to your list first.');
            return;
        }

        setIsExporting(true);

        const loadingToast = showLoading('Exporting PDF...');

        try {
            const doc = new jsPDF('landscape');

            doc.setFontSize(20);
            doc.text(listData.title, 20, 30);

            doc.setFontSize(12);
            const authorName = listData.author?.username || listData.author || 'username';
            doc.text(`by @${authorName}`, 20, 45);

            if (listData.description) {
                doc.setFontSize(10);
                doc.text(listData.description, 20, 60);
            }

            let yPosition = listData.description ? 80 : 60;
            const itemsPerRow = 2;
            const itemWidth = 80;
            const itemHeight = 100;
            const spacing = 20;

            for (let i = 0; i < listData.items.length; i++) {
                const item = listData.items[i];
                const row = Math.floor(i / itemsPerRow);
                const col = i % itemsPerRow;
                const x = 20 + col * (itemWidth + spacing);
                const y = yPosition + row * (itemHeight + spacing);

                if (item.cachedData?.posterUrl) {
                    try {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        
                        await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                            img.src = item.cachedData.posterUrl;
                        });
                        
                        doc.addImage(img, 'JPEG', x, y, itemWidth, itemHeight - 20);
                    } catch (error) {
                        console.warn('Error adding image:', error);
                        doc.rect(x, y, itemWidth, itemHeight - 20);
                        doc.setFontSize(8);
                        doc.text('No Poster', x + 5, y + 10);
                    }
                } else {
                    doc.rect(x, y, itemWidth, itemHeight - 20);
                    doc.setFontSize(8);
                    doc.text('No Poster', x + 5, y + 10);
                }
                doc.setFontSize(10);
                doc.text(item.title || 'No Title', x + 5, y + itemHeight - 10);

                if (item.category === 'music' && item.cachedData?.artist) {
                    doc.setFontSize(8);
                    doc.text(item.cachedData.artist, x + 5, y + itemHeight - 5);
                }
                
                if (item.cachedData?.year) {
                    doc.setFontSize(8);
                    if (item.category === 'music') {
                        doc.text(`(${item.cachedData.year})`, x + 5, y + itemHeight - 2);
                    } else {
                        doc.text(`(${item.cachedData.year})`, x + 5, y + itemHeight - 5);
                    }
                }
            }

            doc.setFontSize(10);
            doc.setTextColor(128, 128, 128);
            doc.text('topmeup.app', doc.internal.pageSize.width - 60, doc.internal.pageSize.height - 10);

            doc.save(`${listData.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);

            hideLoading(loadingToast);
            showSuccess('PDF exported successfully!');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            hideLoading(loadingToast);
            showError('Failed to export PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportImage = async (format) => {
        if (isEmpty) {
            showWarning('Cannot export empty list. Add some items to your list first.');
            return;
        }

        setIsExporting(true);
        const loadingToast = showLoading(`Exporting ${format}...`);
        let tempDiv = null;

        try {
            const screenWidth = window.innerWidth;
            const exportWidth = Math.min(800, screenWidth - 40);

            tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.width = `${exportWidth}px`;
            tempDiv.style.backgroundColor = 'white';
            tempDiv.style.padding = '20px';
            tempDiv.style.fontFamily = 'Arial, sans-serif';

            let html = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="font-size: 24px; margin: 0;">${listData.title}</h1>
                    <p style="font-size: 14px; color: #666; margin: 5px 0;">by @${listData.author?.username || listData.author || 'username'}</p>
                    ${listData.description ? `<p style="font-size: 12px; color: #888; margin: 10px 0;">${listData.description}</p>` : ''}
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
            `;

            listData.items.forEach(item => {
                const posterUrl = item.cachedData?.posterUrl;

                const posterHtml = posterUrl
                    ? `<img src="${posterUrl}" style="width: 100%; max-width: 200px; height: 300px; object-fit: cover; border-radius: 4px;" alt="Poster" crossorigin="anonymous" />`
                    : `<div style="width: 100%; max-width: 200px; height: 300px; background: #f0f0f0; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #999; border-radius: 4px;">No Poster</div>`;

                const artistText = item.category === 'music' && item.cachedData?.artist
                    ? `<div style="font-size: 12px; color: #666;">${item.cachedData.artist}</div>`
                    : '';

                const yearText = item.cachedData?.year
                    ? `<div style="font-size: 12px; color: #666;">(${item.cachedData.year})</div>`
                    : '';

                html += `
                    <div style="border: 1px solid #ddd; padding: 10px; text-align: center; border-radius: 8px;">
                        ${posterHtml}
                        <div style="font-weight: bold; font-size: 14px; margin-top: 10px;">${item.title || 'No title'}</div>
                        ${artistText}
                        ${yearText}
                    </div>
                `;
            });

            html += `</div>`;
            tempDiv.innerHTML = html;
            document.body.appendChild(tempDiv);

            const canvas = await html2canvas(tempDiv, {
                width: exportWidth,
                height: tempDiv.scrollHeight,
                backgroundColor: 'white',
                useCORS: true,
                allowTaint: true
            });

            const ctx = canvas.getContext('2d');
            ctx.font = '14px Arial';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillText('topmeup.app', canvas.width - 140, canvas.height - 20);

            const link = document.createElement('a');
            const filename = `${listData.title.replace(/[^a-z0-9]/gi, '_')}.${format.toLowerCase()}`;
            link.download = filename;

            if (format.toLowerCase() === 'jpg') {
                link.href = canvas.toDataURL('image/jpeg', 0.8);
            } else {
                link.href = canvas.toDataURL('image/png');
            }

            link.click();

            hideLoading(loadingToast);
            showSuccess(`${format} exported successfully!`);
        } catch (error) {
            console.error(`Error exporting ${format}:`, error);
            hideLoading(loadingToast);
            showError(`Failed to export ${format}. Please try again.`);
        } finally {
            setIsExporting(false);
            if (tempDiv && document.body.contains(tempDiv)) {
                document.body.removeChild(tempDiv);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Export List</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ✕
                    </button>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">{listData.title}</h3>
                    <p className="text-gray-600 text-sm">by @{listData.author || 'username'}</p>
                    {listData.description && (
                        <p className="text-gray-500 text-xs mt-1">{listData.description}</p>
                    )}
                </div>

                {isEmpty && (
                    <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-yellow-800">
                        Cannot export empty list. Add some items first.
                    </div>
                )}

                <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-4">Choose export format:</p>

                    <div className="grid grid-cols-1 gap-4">
                        {/* PDF */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <span className="text-2xl mr-3">📄</span>
                                <div>
                                    <h4 className="font-semibold">PDF</h4>
                                    <p className="text-sm text-gray-600">High quality, Print ready</p>
                                </div>
                            </div>
                            <button
                                onClick={handleExportPDF}
                                disabled={isExporting || isEmpty}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isExporting ? 'Exporting...' : 'Export PDF'}
                            </button>
                        </div>

                        {/* PNG */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <span className="text-2xl mr-3">🖼️</span>
                                <div>
                                    <h4 className="font-semibold">PNG</h4>
                                    <p className="text-sm text-gray-600">Image file, Social media</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleExportImage('PNG')}
                                disabled={isExporting || isEmpty}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                                {isExporting ? 'Exporting...' : 'Export PNG'}
                            </button>
                        </div>

                        {/* JPG */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <span className="text-2xl mr-3">📱</span>
                                <div>
                                    <h4 className="font-semibold">JPG</h4>
                                    <p className="text-sm text-gray-600">Compressed, Smaller size</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleExportImage('JPG')}
                                disabled={isExporting || isEmpty}
                                className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                            >
                                {isExporting ? 'Exporting...' : 'Export JPG'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ExportModal;