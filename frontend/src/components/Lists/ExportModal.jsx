import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExportModal = ({ isOpen, onClose, listData }) => {
    const [isExporting, setIsExporting] = useState(false);
}