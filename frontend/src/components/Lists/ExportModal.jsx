import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '../../contexts/ToastContext';

const posterConfig = {
    movies: { widthPdf: 22, heightPdf: 33, widthPx: 64, heightPx: 96, imgFit: 'cover', containerBg: '#f0f0f0' },
    music: { widthPdf: 22, heightPdf: 22, widthPx: 64, heightPx: 64, imgFit: 'cover', containerBg: '#f0f0f0' },
    games: { widthPdf: 30, heightPdf: 20, widthPx: 96, heightPx: 54, imgFit: 'cover', containerBg: '#000000' },
};

const getPosterPreset = (category) => posterConfig[category] || posterConfig.movies;

const ExportModal = ({ isOpen, onClose, listData }) => {
    const [isExporting, setIsExporting] = useState(false);
    const { showSuccess, showError, showWarning, showLoading, hideLoading } = useToast();

    if (!isOpen) return null;

    const isEmpty = !listData.items || listData.items.length === 0;

    const saveBlobWithPicker = async (blob, suggestedName, mime) => {
        try {
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName,
                    types: [
                        {
                            description: mime,
                            accept: { [mime]: [`.${suggestedName.split('.').pop()}`] },
                        },
                    ],
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                return true;
            }
        } catch {
            if (error?.name === 'AbortError' || error?.name === 'NotAllowedError') {
                return false;
            }
            return false;
        }
        return false;
    }

    const resolveAuthor = () => {
        const a = listData.user || listData.author || listData.owner;
        if (!a) return 'user';
        if (typeof a === 'string') return a;
        return (
            a.displayName ||
            a.username ||
            a.name ||
            a.nickname ||
            (a.email ? a.email.split('@')[0] : 'user')
        );
    };

    const proxify = (url) => {
        if (!url) return url;
        if (url.includes('media.rawg.io') || url.includes('tmdb.org') || url.includes('spotifycdn'))
            return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/proxy/img?url=${encodeURIComponent(url)}`;
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
            const doc = new jsPDF();

            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();

            doc.setFontSize(24);
            doc.text(listData.title, pageW / 2, 20, { align: 'center' });

            doc.setFontSize(14);
            const authorHandle = resolveAuthor();
            doc.text(`by ${authorHandle}`, pageW / 2, 30, { align: 'center' });

            if (listData.description) {
                doc.setFontSize(10);
                doc.text(listData.description, pageW / 2, 40, { align: 'center', maxWidth: 160 });
            }

            const marginX = 15;
            const gapX = 10;
            const columns = 2;

            const startY = listData.description ? 50 : 40;
            const bottomMargin = 14;
            const availableH = pageH - startY - bottomMargin;

            const maxPosterHeight = Math.max(
                posterConfig.movies.heightPdf,
                posterConfig.music.heightPdf,
                posterConfig.games.heightPdf
            );

            const textPadX = 6;

            const colWidth = (pageW - marginX * 2 - gapX) / columns;
            const rowHeight = maxPosterHeight + 6;
            const rowsPerPage = Math.min(5, Math.floor(availableH / rowHeight));

            for (let i = 0; i < listData.items.length; i++) {
                const item = listData.items[i];
                const row = Math.floor((i % (columns * rowsPerPage)) / columns);
                const col = i % columns;

                if (i > 0 && i % (columns * rowsPerPage) === 0) {
                    doc.addPage();
                }

                const preset = getPosterPreset(item.category);
                const colLeft = marginX + col * (colWidth + gapX);
                const x = colLeft + 2;
                const y = startY + row * rowHeight;

                const src = proxify(item.cachedData?.posterUrl);

                if (src) {
                    try {
                        const img = await new Promise((res, rej) => {
                            const im = new Image();
                            im.crossOrigin = 'anonymous';
                            im.onload = () => res(im);
                            im.onerror = rej;
                            im.src = src;
                        });

                        const imgAspect = img.width / img.height;
                        const boxAspect = preset.widthPdf / preset.heightPdf;
                        let drawW = preset.widthPdf;
                        let drawH = preset.heightPdf;
                        let drawX = x;
                        let drawY = y;

                        if (imgAspect > boxAspect) {
                            drawW = preset.widthPdf;
                            drawH = drawW / imgAspect;
                            drawY = y + (preset.heightPdf - drawH) / 2;
                        } else {
                            drawH = preset.heightPdf;
                            drawW = drawH * imgAspect;
                            drawX = x + (preset.widthPdf - drawW) / 2;
                        }

                        doc.addImage(img, 'JPEG', drawX, drawY, drawW, drawH);
                    } catch {
                        doc.rect(x, y, preset.widthPdf, preset.heightPdf);
                        doc.setFontSize(8);
                        doc.text('No Poster', x + 3, y + preset.heightPdf / 2);
                    }
                } else {
                    doc.rect(x, y, preset.widthPdf, preset.heightPdf);
                    doc.setFontSize(8);
                    doc.text('No Poster', x + 3, y + preset.heightPdf / 2);
                }

                const tx = x + preset.widthPdf + textPadX;
                const ty = y + 5;
                const textWidth = colWidth - preset.widthPdf - textPadX - 4;

                doc.setFontSize(9);
                const titleLines = doc.splitTextToSize(item.title || 'No Title', textWidth);
                titleLines.forEach((line, lineIndex) => {
                    doc.text(line, tx, ty + (lineIndex * 4), { maxWidth: textWidth });
                });

                const titleLinesCount = titleLines.length;
                doc.setFontSize(8);
                if (item.category === 'music' && item.cachedData?.artist) {
                    doc.text(item.cachedData.artist, tx, ty + (titleLinesCount * 4), { maxWidth: textWidth });
                    if (item.cachedData?.year) doc.text(`(${item.cachedData.year})`, tx, ty + (titleLinesCount * 4) + 5);
                } else if (item.cachedData?.year) {
                    doc.text(`(${item.cachedData.year})`, tx, ty + (titleLinesCount * 4));
                }
            }

            doc.setFontSize(10);
            doc.setTextColor(128, 128, 128);
            doc.text('topmeup.app', pageW - 20, pageH - 10, { align: 'right' });

            const filename = `${listData.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;

            const pdfBlob = doc.output('blob');
            const saved = await saveBlobWithPicker(pdfBlob, filename, 'application/pdf');
            hideLoading(loadingToast);
            if (saved) {
                showSuccess('PDF saved successfully.');
            } else {
                doc.save(filename);
            }
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
            const exportWidth = 700;

            tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.width = `${exportWidth}px`;
            tempDiv.style.backgroundColor = '#ffffff';
            tempDiv.style.padding = '30px';
            tempDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif';

            const authorHandle = resolveAuthor();

            let html = `
                <div style="text-align:center;margin-bottom:20px;">
                    <h1 style="font-size:24px;margin:0;color:#111;">${listData.title}</h1>
                    <p style="font-size:13px;color:#666;margin:5px 0;">by ${authorHandle}</p>
                    ${listData.description ? `<p style="font-size:12px;color:#888;margin:8px auto 0;max-width:500px;">${listData.description}</p>` : ''}
                </div>
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;max-width:660px;margin:0 auto;">
            `;

            listData.items.forEach(item => {
                const preset = getPosterPreset(item.category);
                const src = item.cachedData?.posterUrl ? proxify(item.cachedData.posterUrl) : '';

                const posterStyle = `
                    width:${preset.widthPx}px;
                    height:${preset.heightPx}px;
                    border-radius:8px;
                    overflow:hidden;
                    background:#f0f0f0;
                    flex:0 0 ${preset.widthPx}px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                `;

                const posterHtml = src
                    ? `<div style="${posterStyle}">
                            <img src="${src}" style="width:100%;height:100%;object-fit:${preset.imgFit};object-position:center;display:block" alt="Poster" crossorigin="anonymous" />
                       </div>`
                    : `<div style="${posterStyle};color:#999;font-size:11px;">No Poster</div>`;

                const artistHtml = (item.category === 'music' && item.cachedData?.artist)
                    ? `<div style="font-size:12px;color:#666;margin-top:2px;">${item.cachedData.artist}</div>`
                    : '';
                const yearHtml = item.cachedData?.year
                    ? `<div style="font-size:11px;color:#888;margin-top:2px;">(${item.cachedData.year})</div>`
                    : '';

                html += `
                    <div style="background:#fff;border:1px solid #eee;border-radius:8px;padding:8px 10px;display:flex;gap:10px;align-items:flex-start;">
                        ${posterHtml}
                        <div style="min-width:0;">
                            <div style="font-weight:600;font-size:14px;color:#111;line-height:1.25;">${item.title || 'No title'}</div>
                            ${artistHtml}
                            ${yearHtml}
                        </div>
                    </div>
                `;
            });

            html += `</div>`;

            html += `
                <div style="text-align:right;padding-top:30px;padding-bottom:10px;margin-top:20px;">
                    <span style="font-size:14px;color:rgba(0,0,0,0.4);font-weight:bold;">topmeup.app</span>
                </div>
            `;

            tempDiv.innerHTML = html;
            document.body.appendChild(tempDiv);

            await new Promise(resolve => setTimeout(resolve, 400));

            const canvas = await html2canvas(tempDiv, {
                width: exportWidth,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                scale: 2
            });

            const filename = `${listData.title.replace(/[^a-z0-9]/gi, '_')}.${format.toLowerCase()}`;

            const blob = await new Promise(resolve => canvas.toBlob(
                resolve,
                format.toLowerCase() === 'jpg' ? 'image/jpeg' : 'image/png',
                0.92
            ));
            const saved = blob ? await saveBlobWithPicker(
                blob,
                filename,
                format.toLowerCase() === 'jpg' ? 'image/jpeg' : 'image/png'
            ) : false;

            hideLoading(loadingToast);
            if (saved) {
                showSuccess(`${format} saved successfully.`);
            } else {
                const link = document.createElement('a');
                link.download = filename;
                link.href = format.toLowerCase() === 'jpg'
                    ? canvas.toDataURL('image/jpeg', 0.92)
                    : canvas.toDataURL('image/png');
                link.click();
            }
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

    const authorName = resolveAuthor();

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

                <div className="mb-4 text-center">
                    <h3 className="text-lg font-semibold mb-2">{listData.title}</h3>
                    <p className="text-gray-600 text-sm">by {authorName}</p>
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